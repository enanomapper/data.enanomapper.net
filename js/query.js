var Manager, 
		Basket,
		Facets = { 
  		'name': "s_uuid" ,
  		'topcategory' : 'module',
  		'endpointcategory' : 'endpoint',
  		'parameter' : 'cleanedvalue'

  	},
    Colors = {
      "endpointcategory": "blue",
      "effectendpoint": "green",
    };

(function($) {
	$(function() {
  	Settings = {
     solrUrl : 'http://localhost:8983/solr/templates_shard1_replica1/',
			root : "http://ambit.sf.net/enanomapper/templates/",
			summaryProperty: null
		};
		Manager = new AjaxSolr.Manager(Settings);
		
		Manager.addWidget(new AjaxSolr.ResultWidget({
			id : 'result',
			target : $('#docs'),
			settings : Settings,
			onClick : function (e, doc, exp, widget) { 
				if (!Basket.findItem(doc)) {
					Basket.addItem(doc, exp);
					var s = "", jel = $('a[href="#basket_tab"]');
					
					jel.html(jT.ui.updateCounter(jel.html(), Basket.length));
					
					Basket.enumerateItems(function (d) { s += d.s_uuid + ";";});
					if (!!(s = ccLib.modifyURL(window.location.href, "basket", s)))
						window.history.pushState({ query : window.location.search }, document.title, s);					

					$("footer", this).toggleClass("add none");					
				}
			},
			onCreated : function (doc) {
				$("footer", this).addClass("add");
			}
		}));

		Manager.addWidget(new AjaxSolr.PagerWidget({
			id : 'pager',
			target : $('#pager'),
			prevLabel : '&lt;',
			nextLabel : '&gt;',
			innerWindow : 1,
			renderHeader : function(perPage, offset, total) {
				$('#pager-header').html('<span>' +
								'displaying ' + Math.min(total, offset + 1)
										+ ' to '
										+ Math.min(total, offset + perPage)
										+ ' of ' + total
								+ '</span>');
			}
		}));

		var fel = $("#tag-section").html();
        renderTag = function (facet, count, hint, handler) {
          var view = facet = facet.replace(/^\"(.+)\"$/, "$1");
          if (typeof hint === 'function') {
            handler = hint;
            hint = null;
          }
              
          if (facet.lastIndexOf("caNanoLab.", 0) == 0)
            view = facet.replace("caNanoLab.","");
          else if (facet.lastIndexOf("http://dx.doi.org/", 0) == 0)
            view = facet.replace("http://dx.doi.org/", "");
          else
        	  view = (lookup[facet] || facet).replace("NPO_", "").replace(" nanoparticle", "");
          
          return $('<li><a href="#" class="tag" title="' + view + (hint || "") + ((facet != view) ? ' [' + facet + ']' : '') + '">' + view + ' <span>' + (count || 0) + '</span></a></li>')
              .click(handler);
          };

		// Now the actual initialization of facet widgets
		$("#accordion .widget-content").each(function (idx){
			var me = $(this),
					hdr = me.closest(".widget-root").prev(),
					fid = me.data("facet"),
					col = me.data("color"),
					f = Facets[fid];
					
			if (!f) {
				console.log("Referred a missing wisget: " + fid);
				return;
			}

  		if (!!col) {
      	Colors[f] = col;
      	me.addClass(col);
      }

			Manager.addWidget(new AjaxSolr.TagWidget({
				id : fid,
				target : me,
				header: hdr,
				field : f,
				color: col,
				multivalue: true,
				renderTag: renderTag
			}));
		});
		
		/*
		Manager.addWidget(new AjaxSolr.PivotWidget({
			id : "studies",
			target : $(".after_topcategory"),
			colorMap: Colors,
			multivalue: true,
			renderTag: renderTag,
			tabsRefresher: getTabsRefresher 
		}));
		*/
    // ... And finally the current-selection one, and ...
		Manager.addWidget(new AjaxSolr.CurrentSearchWidget({
			id : 'currentsearch',
			target : $('#selection'),
			renderTag : renderTag,
			colorMap : Colors
		}));

		// ... auto-completed text-search.
		Manager.addWidget(new AjaxSolr.AutocompleteWidget({
			id : 'text',
			target : $('#search'),
			fields : [ 
					'_text_' ]
		}));
		
		// Now add the basket.
		Basket = new ItemListWidget({
			id : 'basket',
			target : '#basket-docs',
			settings : Settings,
			onClick : function (e, doc, exp) {
				if (Basket.eraseItem(doc.s_uuid) === false) {
					console.log("Trying to remove from basket an inexistent entry: " + JSON.stringify(doc));
					return;
				}
				
				$(this).remove();
				var s = "", jel = $('a[href="#basket_tab"]');
				jel.html(jT.ui.updateCounter(jel.html(), Basket.length));
				Basket.enumerateItems(function (d) { s += d.s_uuid + ";";});
				if (!!(s = ccLib.modifyURL(window.location.href, "basket", s)))
					window.history.pushState({ query : window.location.search }, document.title, s);
							
				$("footer", $("#result_" + doc.s_uuid)[0]).toggleClass("add none");
			},
			onCreated: function (doc) {
				$("footer", this).addClass("remove");
			}			
		});
		
		Manager.init();
		
		// now get the search parameters passed via URL	
		Manager.store.addByValue('q', $.url().param('search') || '*:*');
		
		var params = {
			'facet' : true,
			'facet.field' : ['unit'],
			'facet.limit' : -1,
			'facet.mincount' : 1,
      // https://cwiki.apache.org/confluence/display/solr/Collapse+and+Expand+Results
			'fq' : "{!collapse field=s_uuid}",
			'fl' : 'type_s:"study",s_uuid,name:File,doc_uuid:id,topcategory:module,endpointcategory:endpoint,guidance:Annotation,publicname:s_uuid,reference:term_uri,reference_owner:term_score,reference_year:term_label,content:"",owner_name:s_uuid,loValue:Row,upValue:Column,owner_name:"Templates",substanceType:sheet_label,effectendpoint:cleanedvalue,interpretation_result:"",unit:unit,term_score,sheet_score',
			'stats': true,			
			'json.nl' : "map",
			'rows' : 20,
			'expand' : true,
			'expand.rows' : 60
		};
		
		for ( var name in params)
			Manager.store.addByValue(name, params[name]);

		Manager.doRequest();

		// Set some general search machanisms
		$(document).on('click', "a.freetext_selector", function (e) {
  		Manager.store.addByValue('q', AjaxSolr.Parameter.escapeValue(this.innerText));
  		Manager.doRequest();
		});
	});
})(jQuery);
