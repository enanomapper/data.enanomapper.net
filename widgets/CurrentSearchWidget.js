(function (Solr, a$, $, jT) {

jT.CurrentSearchWidgeting = function (settings) {
  a$.extend(true, this, settings);
  
  this.manager = null;
  this.skipClear = false;
  this.facetWidgets = {};
  this.fqName = this.useJson ? "json.filter" : "fq";
};

jT.CurrentSearchWidgeting.prototype = {
  init: function (manager) {
    var self = this;
        self.slidersBlock = $("#sliders");
        
    self.manager = manager;
        
    self.applyCommand = $("#sliders-controls a.command.apply").on("click", function (e) {
      self.skipClear = true;
      self.manager.doRequest();
      return false;
    });
    
    $("#sliders-controls a.command.close").on("click", function (e) {
      self.rangeRemove();
      return false;
    });
  },
  
  addWidget: function (widget) {
    this.facetWidgets[widget.id] = true;
  },
  
  afterTranslation: function (data) {
    var self = this,
        links = [],
        q = this.manager.getParameter('q'),
        fq = this.manager.getAllValues(this.fqName);
        
    if (self.skipClear) {
      self.skipClear = false;
      return;
    }
        
    self.rangeRemove();
    
    // add the free text search as a tag
    if (!q.value.match(/\*?:?\*?/)) {
        links.push(self.renderTag({ title: q.value, count: "x", onMain: function () {
          q.value = "";
          self.manager.doRequest();
          return false;
        } }).addClass("tag_fixed"));
    }

    // now scan all the parameters for facets and ranges.
    for (var i = 0, l = fq != null ? fq.length : 0; i < l; i++) {
	    var f = fq[i],
	        vals = null,
	        aux = false;
	    
      for (var wid in self.facetWidgets) {
  	    var w = self.manager.getListener(wid),
  	        vals = w.fqParse(f);
  	        if (!!vals)
  	          break;
  	  }
  	  
  	  if (!Array.isArray(vals))
  	    vals = [ vals ];
  	        
      for (var j = 0, fvl = vals.length; j < fvl; ++j) {
        var v = vals[j], el;
        
    		links.push(el = self.renderTag({ 
      		title: v, 
      		count: "i", 
      		onMain: w.unclickHandler(v),
          onAux: aux ? self.rangePresent(w, v) : null
        }).addClass("tag_selected " + (aux ? "tag_open" : "tag_fixed")));

    		if (fvl > 1)
    		  el.addClass("tag_combined");
    		  
    		if (w.color)
    		  el.addClass(w.color);
      }
      
      if (fvl > 1)
		    el.addClass("tag_last");
    }
    
    if (links.length) {
      links.push(self.renderTag({ title: "Clear", onMain: function () {
        q.value = "";
        a$.each(self.valueMap, function (vals, wid) { self.manager.getListener(wid).clearValues(); });
        self.valueMap = {};
        self.manager.removeParameters(self.fqName, self.rangeFieldRegExp);
        self.manager.doRequest();
        return false;
      }}).addClass('tag_selected tag_clear tag_fixed'));
      
      this.target.empty().addClass('tags').append(links);
    }
    else
      this.target.removeClass('tags').html('<li>No filters selected!</li>');
  },
  
  rangeRemove: function() {
    this.slidersBlock.empty();
    this.slidersBlock.parent().removeClass("active");
    $("li", this.target[0]).removeClass("active");
  },
  
  rangePresent: function (widget, value) {
    var self = this;
    return function (e) {
      var pivots = PivotWidget.locatePivots(field, value, PivotWidget.unitField),
          // build a counter map of found pivots.
          pivotMap = (function() {
            var map = {};
            for (var i = 0, pl = pivots.length; i < pl; ++i) {
              var pe = pivots[i];
              for (var pp = pe; !!pp; pp = pp.parent) {
                var info = map[pp.field];
                if (!info)
                  map[pp.field] = info = {};
                  
                if (!info[pp.value])
                  info[pp.value] = 1;
                else
                  info[pp.value]++;
              }
            }
            
            return map;
          })(),
          updateRange = function(range, prec) {  return function (values) {
            values = values.split(",").map(function (v) { return parseFloat(v); });
            
            // Fix the rouding error, because an entire entry can fall out...
            if (Math.abs(range.overall.max - values[1]) <= prec)
              values[1] = range.overall.max;
            if (Math.abs(range.overall.min - values[0]) <= prec)
              values[0] = range.overall.min;
              
            // Now, make the actual Solr parameter setting.
            self.tweakAddRangeParam(range, values);

            // add it to our range list, if it is not there already
            if (self.rangeParameters.indexOf(range) == -1)
              self.rangeParameters.push(range);

            self.applyCommand.css("opacity", 1.0);
            setTimeout(function () { self.applyCommand.css("opacity", ""); }, 500);
          } },
          matchRange = function (pivot) {
            var ctx = { },
                path = [];
                
            // build context AND path for the overallStatistics
            for (var pp = pivot; !!pp; pp = pp.parent) {
              path.push(pp.value.replace(/\s/, "_"));
              if (PivotWidget.contextFields.indexOf(pp.field) > -1 || pivotMap[pp.field][pp.value] < pivots.length)
                ctx[pp.field] = pp.value;
            }

            var rng = self.rangeParameters.find( function (e) { 
              return a$.similar(e.context, ctx);
            });
            
            path.reverse();
            var over_stats = a$.path(PivotWidget.overallStatistics, path) || { loValue: { min: 0, max: 100 } };
            
            return a$.extend(rng, { 'context': ctx }, pivot.stats.stats_fields.loValue, { overall: over_stats.loValue });
          };

      if ($(this).closest("li").hasClass("active")) {
        self.rangeRemove();
        return false;
      }
      
      $("li", self.target[0]).removeClass("active");
      $(this).closest("li").addClass("active");
      self.slidersBlock.empty().parent().addClass("active");
      
      for (var i = 0, lp = pivots.length;i < lp; ++i) {
        var pe = pivots[i],
            range = matchRange(pe),
            prec = Math.pow(10, parseInt(Math.min(1, Math.floor(Math.log10(range.overall.max - range.overall.min + 1) - 3)))),
            names = [],
            enabled = (range.overall.min < range.overall.max),
            units = (pe.field == PivotWidget.unitField ? jT.ui.formatUnits(pe.value) : ""),
            scale;

        // jRange will treat 0.1 range, as 0.01, so we better set it this way
        if (prec < 1 && prec > .01) 
          prec = .01;

        if (range.value == null)
          range.value = [ range.min, range.max ];
        else {
          range.value[0] = Math.max(range.value[0], range.min);
          range.value[1] = Math.min(range.value[1], range.max);
        }

        // Build the name on the range scale, based on the field:value pairs
        // that are needed for filtering, i.e. - those that differ...
        for(var pp in range.context) {
          var pv = range.context[pp];
          if (pp != PivotWidget.unitField && pivotMap[pp][pv] < pivots.length)
            names.push(getTitleFromFacet(pv));
        }
        
        // ... still have the given filter as fallback for empty scale.
        if (!names.length)
          names.push(getTitleFromFacet(value));
        else
          names.reverse();
          
        // We're ready to prepare the slider and add it to the DOM.
        self.slidersBlock.append(el = jT.ui.fillTemplate("#slider-one", range));
          
        scale = [
          getRoundedNumber(range.overall.min, prec), 
          names.join("/") + (enabled || !units ? "" : " (" + units + ")"), 
          getRoundedNumber(range.overall.max, prec)
          ];
          
        el.jRange({
        	from: scale[0],
        	to: scale[2],
        	step: prec,
        	scale: scale,
        	showScale: true,
        	showLabels: enabled,
        	disable: !enabled,
        	isRange: true,
        	theme: "theme-" + self.facetWidgets[field].color,
        	width: parseInt(self.slidersBlock.width() - $("#sliders-controls").width() - 20) / (Math.min(lp, 2) + 0.1),
        	format: "%s " + units,
        	ondragend: updateRange(range, prec)
      	});
      }
      
      e.stopPropagation();
      e.preventDefault();
      return false;
    };
  }

};

jT.CurrentSearchWidget = a$(jT.CurrentSearchWidgeting);

})(Solr, asSys, jQuery, jToxKit);
