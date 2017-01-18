(function (Solr, a$, $, jT) {
  
	var buildValueRange = function (stats) {
				return 	" = " + (stats.min == null ? "-&#x221E;" :  stats.min) +
								"&#x2026;" + (stats.max == null ? "&#x221E;" : stats.max) +
								" " + jT.ui.formatUnits(stats.val);
			},
			tagModifier = function (info) {
  			// TODO: Probably scan all the sub-buckets.
  			info.hint = buildValueRange(stats);
  			return info;
  		};

  function InnerTagWidgeting (settings) {
    this.id = settings.id;
    this.pivotWidget = settings.pivotWidget;
  };
  
  InnerTagWidgeting.prototype = {
    pivotWidget: null,
    
    hasValue: function (value) {
      return this.pivotWidget.hasValue(value, this.id);
    },
    
    clickHandler: function (value) {
      return this.pivotWidget.clickHandler(value, this.id);
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
    
    traversePivot: function (target, root, idx) {
      var elements = [],
          faceter = this.getPivotEntry(idx),
          bucket = root[faceter.id].buckets;
			
			if (!bucket || !bucket.length) // no separate pivots - nothing to declare
				return elements;
      else if (idx === this.lastEnabled) {
        var w = target.data("widget");
        if (!w) {
          w = new InnerTagWidget({
            id: faceter.id,
            color: faceter.color,
            renderItem: this.renderTag,
            pivotWidget: this,
            target: target,
            modifyTag: tagModifier
          });

          w.init(this.manager);
          target.data({ widget: w, id: faceter.id });
        }
        else
          target.children().slice(1).remove();

        w.populate(bucket, true);        
        elements = [ ];
      }
			else {
  			for (var i = 0, fl = bucket.length;i < fl; ++i) {
  				var f = bucket[i],
  				    fid = f.val.replace(/\s/g, "_"),
  				    cont$;

          if (target.children().length > 1) // the input field.
            cont$ = $("#" + fid, target[0]).show();
          else {
				    cont$ = jT.ui.fillTemplate($("#tag-facet"), faceter).attr("id", fid);
            
    				f.title = f.val;
    				f.onMain = this.clickHandler(f.val, faceter.id);
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
		}		
	};
	
	jT.PivotWidget = a$(Solr.Requesting, Solr.Pivoting, PivotWidgeting);
	
})(Solr, asSys, jQuery, jToxKit);
