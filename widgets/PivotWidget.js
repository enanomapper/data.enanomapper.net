(function (Solr, a$, $, jT) {
  
  function buildValueRange(stats, isUnits) {
    var vals = " = ";

    // min ... average? ... max
    vals += (stats.min == null ? "-&#x221E;" :  stats.min);
    if (!!stats.avg) vals += "&#x2026;" + stats.avg;
    vals += "&#x2026;" + (stats.max == null ? "&#x221E;" : stats.max);
  						
    if (isUnits)
      vals += " " + jT.ui.formatUnits(stats.val)
        .replace("<sup>2</sup>", "&#x00B2;")
        .replace("<sup>3</sup>", "&#x00B3;")
        .replace(/<sup>(\d)<\/sup>/g, "^$1");
        
    return vals;
	};

  function InnerTagWidgeting (settings) {
    this.id = settings.id;
    this.pivotWidget = settings.pivotWidget;
  };
  
  InnerTagWidgeting.prototype = {
    pivotWidget: null,
    
    hasValue: function (value) {
      return this.pivotWidget.hasValue(this.id + ":" + value);
    },
    
    clickHandler: function (value) {
      return this.pivotWidget.clickHandler(this.id + ":" + value);
    },
    
    modifyTag: function (info) {
      info.hint = !info.unit ? 
        info.buildValueRange(info) :
        "\n" + info.unit.buckets.map(function (u) { return buildValueRange(u, true); }).join("\n");
        
      info.color = this.color;
  		return info;
    }
  };
  
  var InnerTagWidget = a$(jT.TagWidget, InnerTagWidgeting);
  
	/** The general wrapper of all parts
  	*/
  function PivotWidgeting (settings) {
    a$.extend(true, this, a$.common(settings, this));

    this.target = settings.target;
    this.targets = {};
    this.lastEnabled = 0;
  };
  
  PivotWidgeting.prototype = {
    __expects: [ "getPivotEntry", "getPivotCounts" ],
    automatic: false,
    renderTag: null,
    
    init: function (manager) {
      a$.pass(this, PivotWidgeting, "init", manager);
      this.manager = manager;
      
      this.manager.getListener("current").registerWidget(this, true);
    },
    
    addFaceter: function (info, idx) {
      var f = a$.pass(this, PivotWidgeting, "addFaceter", info, idx);
      if (typeof info === "object")
        f.color = info.color;
      if (idx > this.lastEnabled && !info.disabled)
        this.lastEnabled = idx;

      return f;
    },
    
    afterTranslation: function (data) {
      var pivot = this.getPivotCounts(data.facets);
          
      // Iterate on the main entries
      for (i = 0;i < pivot.length; ++i) {
        var p = pivot[i],
            pid = p.val.replace(/\s/g, "_"),
            target = this.targets[pid];
        
        if (!target) {
          this.targets[pid] = target = new jT.AccordionExpansion($.extend(true, {}, this.settings, this.getPivotEntry(0), { id: pid, title: p.val }));
          target.updateHandler = this.updateHandler(target);
          target.target.children().last().remove();
        }
        else
          target.target.children('ul').hide();
          
        this.traversePivot(target.target, p, 1);
        target.updateHandler(p.count);
      }
      
      // Finally make this update call.
      this.target.accordion("refresh");
    },
    
    updateHandler: function (target) {
			var hdr = target.getHeaderText();
			return function (count) { hdr.textContent = jT.ui.updateCounter(hdr.textContent, count); };
    },
    
    prepareTag: function (value) {
      var p = this.parseValue(value);
      return {
        title: p.value,
        color: this.faceters[p.id].color,
        count: "i",
        onMain: this.unclickHandler(value),
        onAux: this.rangePresent(value)
      };
    },
    
    traversePivot: function (target, root, idx) {
      var elements = [],
          faceter = this.getPivotEntry(idx),
          bucket = root[faceter.id].buckets;
			
      if (idx === this.lastEnabled) {
        var w = target.data("widget");
        if (!w) {
          w = new InnerTagWidget({
            id: faceter.id,
            color: faceter.color,
            renderItem: this.renderTag,
            pivotWidget: this,
            target: target
          });

          w.init(this.manager);
          target.data({ widget: w, id: faceter.id });
        }
        else
          target.children().slice(1).remove();

        w.populate(bucket, true);        
        elements = [ ];
      }
			else if (bucket != null) {
  			for (var i = 0, fl = bucket.length;i < fl; ++i) {
  				var f = bucket[i],
  				    fid = f.val.replace(/\s/g, "_"),
  				    cont$;

          if (target.children().length > 1) // the input field.
            cont$ = $("#" + fid, target[0]).show();
          else {
				    cont$ = jT.ui.fillTemplate($("#tag-facet"), faceter).attr("id", fid);
            
    				f.title = f.val;
    				f.onMain = this.clickHandler(faceter.id + ":" + f.val);
    				f.hint = buildValueRange(f);
  					cont$.append(this.renderTag(f).addClass("category title").addClass(faceter.color));
            elements.push(cont$);
          }
  				    
					this.traversePivot(cont$, f, idx + 1);
        }
      }
      
      target.append(elements);
		},
		
		locatePivots: function (field, value, deep) {
  	  		var pivots = [],
  	      searchLevel = function (list, found) {
    	      if (!list || !list.length) return;
    	      for (var i = 0, ll = list.length, e; i < ll; ++i) {
      	      e = list[i];
      	        
      	      if (e.field === field) {
        	      if (!(found = (e.value === value)))
                  continue;
              }
      	        
              if (found && (e.field === deep || !e.pivot))
                pivots.push(e);
              else if (!!e.pivot)
    	          searchLevel(e.pivot, found);
    	      }
  	      };
      
			searchLevel(this.manager.response.facet_counts.facet_pivot[this.pivotFields]);
			return pivots;
		},
		
    rangeRemove: function() {
      this.slidersBlock.empty();
      this.slidersBlock.parent().removeClass("active");
      $("li", this.target[0]).removeClass("active");
    },
    
    rangePresent: function (value) {
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
            jT.ui.formatNumber(range.overall.min, prec), 
            names.join("/") + (enabled || !units ? "" : " (" + units + ")"), 
            jT.ui.formatNumber(range.overall.max, prec)
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
	
	jT.PivotWidget = a$(Solr.Requesting, Solr.Pivoting, PivotWidgeting);
	
})(Solr, asSys, jQuery, jToxKit);
