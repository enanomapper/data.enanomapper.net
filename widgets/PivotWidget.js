(function (Solr, a$, $, jT) {
  
	var buildValueRange = function (stats, suffix) {
				return 	" = " + (stats.min == null ? "-&#x221E;" :  stats.min) +
								"&#x2026;" + (stats.max == null ? "&#x221E;" : stats.max) +
								" " + (suffix == null ? jT.ui.formatUnits(stats.val) : suffix);
			};

	/** The general wrapper of all parts
  	*/
  PivotWidgeting = function (settings) {
    a$.extend(true, this, a$.common(settings, this));

    this.visibleFields = settings.visibleFields || [];
    this.initialized = false;
    this.targets = [];
  }
  
  PivotWidgeting.prototype = {
    automatic: false,
    
    init: function (manager) {
      a$.pass(this, PivotWidgeting, "init", manager);
      this.manager = manager;
    },
    
    afterTranslation: function (data) {
      var f, i, j, p,
          pivot = this.getPivotCounts(data.facets);
          
      if (!this.initialized) {
        f = this.faceters[0];
        
        for (i = 0;i < pivot.length; ++i) {
          p = pivot[i];
          this.targets[i] = new jT.AccordionExpansion($.extend(true, {}, this.settings, f, { id: p.val, title: p.val }));
        }
          
        this.initialized = true;
      }
      
      for (var i = 0, fl = this.faceters.length; i < fl; ++i) {
      }
    },
    
		buildFacetDom: function (facet, renderer) {
      var elements = [], root;
			
			if (facet.pivot == null || !facet.pivot.length) // no separate pivots - nothing to declare
				;
			else {
				for (var i = 0, fl = facet.pivot.length, f;i < fl; ++i) {
					f = facet.pivot[i];
					f.parent = facet;
					elements.push(f.field == this.endpointField ? renderer(f).addClass(this.facetFields[f.field].color) : this.buildFacetDom(f, renderer)[0]);
					if (f.field == this.endpointField && f.pivot)
					  a$.each(f.pivot, function (o) { o.parent = f; });
				}
	
				if (elements.length > 0 && facet.field != this.topField) {
					root = jT.ui.fillTemplate($("#tag-facet"), facet);
					
					// we need to add outselves as main tag
					if (facet.field != this.endpointField)
				    root.append(renderer(facet).addClass("category title").addClass(this.facetFields[facet.field].color));
					
					root.append(elements);
					elements = [root];
				}
			}
			
			return elements;
		},
		
		buildStatistics: function (facet, stats) {
  		var self = this;
  		
  		if (stats === undefined)
  		  stats = self.overallStatistics;
  		  
  		stats = stats[facet.value.replace(/\s/, "_")] = facet.stats.stats_fields;
  		a$.each(facet.pivot, function (f) {
    		self.buildStatistics(f, stats);
  		});
		},
    
		oldTranslation: function(data) {
			var self = this,
					root = data.pivots[self.pivotFields],
					refresh = this.target.data("refreshPanel");
					
			if (root === undefined) {
				this.target.html('No items found in current selection');
				return;
			}

      // some cleanup...
      $(".dynamic-tab", self.target.parent()[0]).each(function () {
  			var hdr = getHeaderText($(this).closest(".widget-root").prev());
  			
        hdr.textContent = jT.ui.updateCounter(hdr.textContent, 0);
        $("ul", this).remove();
      });
      
			for (var i = 0, fl = root.length; i < fl; ++i) {
				var facet = root[i], 
				    fid = facet.value.replace(/\s/, "_"),
				    target;
				
				// we need to check if we have that accordion element created.
				if (facet.field == this.topField) {
  				target = $("#" + fid);
  				
  				if (target.length > 0) {
    				var hdr = getHeaderText(target.closest(".widget-root").prev());
            hdr.textContent = jT.ui.updateCounter(hdr.textContent, facet.count);
    		  }
  				else {
    				facet.id = fid;
    				self.target.before(target = jT.ui.fillTemplate("#tab-topcategory", facet));
    				target = $(target.last()).addClass("dynamic-tab");
    				self.tabsRefresher();
    				self.buildStatistics(facet);
  				}
				}
				
				target.append(self.buildFacetDom(facet, function (f) {
					var msg = "";
					
					if (f.pivot == undefined) 
						msg = buildValueRange(f, "");
					else for ( var j = 0, ul = f.pivot.length; j < ul; ++j ) { 
						if (j > 0)
							msg += ", ";
							
						msg += buildValueRange(f.pivot[j]);
					}
					
					return self.renderTag( f.value, f.count, msg, self.facetFields[f.field].widget.clickHandler(f.value));
				}));
			}
			
			if (!!refresh)
				refresh.call();
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
	
	jT.PivotWidget = a$(Solr.Pivoting, PivotWidgeting);
	
})(Solr, asSys, jQuery, jToxKit);
