var Manager, 
		Basket,
    // https://cwiki.apache.org/confluence/display/solr/Collapse+and+Expand+Results
  	Parameters = {
			'facet.limit' : -1,
			'facet.mincount' : 1,
// 			'echoParams': "none", // enable this for release versions.
			'fl' : "id",
			'json.nl' : "map",
			'q.alt': "*:*",
		},
		Facets = { 
			'substanceType': 	{ field: "substanceType_s", facet: { mincount: 2, limit: -1 } },
  		'owner_name': 		{ field: "owner_name_s", facet: { mincount: 3 } }, 
  		'reference': 			{ field: "reference_s", facet: { mincount: 2 } }, 
  		'reference_year': { field: "reference_year_s", facet: { mincount: 1 } },
  		'protocol': 			{ field: "guidance_s", facet: { mincount: 2 } },
  		'interpretation': { field: "interpretation_result_s", facet: { mincount: 2 } }, 
  		'species': 				{ field: "Species_s", facet: { mincount: 2 }, domain: { blockChildren: "type_s:params" } }, 
  		'cell': 					{ field: "Cell line_s", facet: { mincount: 1, domain: { blockChildren: "type_s:params" } } },
/*
  		'instruments': 		{ field: "_childDocuments_.params.DATA_GATHERING_INSTRUMENTS" },
  		'testtype': '_childDocuments_.conditions.Test_type',
			'solvent' :	'_childDocuments_.conditions.Solvent',
			'route':	'_childDocuments_.params.Route_of_administration',
			'genotoxicity':	'_childDocuments_.params.Type_of_genotoxicity'
			*/
  	},
  	Fields = [ 
      "name:name_hs", 
      "publicname:publicname_hs", 
      "owner_name:owner_name_hs",
      "substanceType:substanceType_hs",
      "s_uuid:s_uuid_hs",
      "content:content_hss",
      "SUMMARY.*"
    ],
    Renderers = {
  		"SIZE": function (val, topic) {
     		if (!Array.isArray(val) || val.length == 1)
     		  return val;
      		  
      		var min = null, 
      		    max = null, 
      		    pattern = null,
      		    re = /([+-]?[0-9]*[.,]?[0-9]+)/;
      		
          for (var i = 0;i < val.length; ++i) {
            var v, m = val[i].match(re);
            
            if (!m) 
              continue;
            if (!pattern)
              pattern = val[i];
              
            v = parseFloat(m[1]);
            if (min == null)
              max = min = v;
            else if (v > max)
              max = v;
            else if (v < min)
              min = v;
          }
          
          return { 'topic': topic.toLowerCase(), 'content' : pattern.replace(re, min + "&nbsp;&hellip;&nbsp;" + max) };
    		}
		},
  	PivotWidget = null;

(function(Solr, a$, $, jT) {
	$(function() {
  	var Settings = {
  	//solrUrl: 'https://search.data.enanomapper.net/solr/enm_shard1_replica1/',
  	//this is test server only    
   		solrUrl: 'https://sandbox.ideaconsult.net/solr/enanondm_shard1_replica1/',
//       solrUrl: 'https://sandbox.ideaconsult.net/solr/nanoreg1ndm_shard1_replica1/',
//       solrUsername: "nanoreg1",
//       solrPassword: "Pl-LPn_nIMw01C7M",
      
// 		  solrUrl: 'https://sandbox.ideaconsult.net/solr/enm_shard1_replica1/',
  		root : "https://data.enanomapper.net/substance/",
  		nestingRules: {
    //       "study": { field: "type_s", parent: "substance", limit: 10 },
        "composition": { field: "type_s", parent: "substance", limit: 100 }
      },
  		servlet: "autophrase",
  		parameters: Parameters,
  		connector: $,
  		onPrepare: function (settings) {
  			var qidx = settings.url.indexOf("?");
  
  			if (this.proxyUrl) {
  				settings.data = { query: settings.url.substr(qidx + 1) };
  				settings.url = this.proxyUrl;
  				settings.type = settings.method = 'POST';
  			}
  			else {
  				settings.url += (qidx < 0 ? "?" : "&" ) + "wt=json"; 
  			}
  		}
		},
		
    Manager = new (a$(Solr.Management, Solr.Configuring, Solr.QueryingJson, jT.Translation, jT.NestedSolrTranslation))(Settings);

    Manager.addListeners(new jT.ResultWidget({
			id : 'result',
			target : $('#docs'),
			settings : Settings,
  		listingFields: Fields,
  		summaryRenderers: Renderers,
  		itemId: "s_uuid",
			onClick : function (e, doc, exp, widget) { 
				if (Basket.findItem(doc.s_uuid) < 0) {
					Basket.addItem(doc);
					var s = "", jel = $('a[href="#basket_tab"]');
					
					jel.html(jT.ui.updateCounter(jel.html(), Basket.length));
					
					Basket.enumerateItems(function (d) { s += d.s_uuid + ";";});
					if (!!(s = jT.ui.modifyURL(window.location.href, "basket", s)))
						window.history.pushState({ query : window.location.search }, document.title, s);					

					$("footer", this).toggleClass("add none");					
				}
			},
			onCreated : function (doc) {
				$("footer", this).addClass("add");
			}
		}));

    Manager.addListeners(new (a$(Solr.Widgets.Pager))({
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

		var fel = $("#tag-section").html(),
        renderTag = function (tag) {
          var view, title = view = tag.title.replace(/^\"(.+)\"$/, "$1");
              
          if (title.lastIndexOf("caNanoLab.", 0) == 0)
            view = title.replace("caNanoLab.","");
          else if (title.lastIndexOf("http://dx.doi.org/", 0) == 0)
            view = title.replace("http://dx.doi.org/", "");
          else
        	  view = (lookup[title] || title).replace(/NPO_|\s+nanoparticle/, "");
        	  
          var aux$ = $('<span/>').html(tag.count || 0);
          if (typeof tag.onAux === 'function')
            in$.click(tag.onAux);
            
          var el$ = $('<li/>')
            .append($('<a href="#" class="tag" title="' + view + " " + (tag.hint || "") + ((title != view) ? ' [' + title + ']' : '') + '">' + view + '</a>')
              .append(aux$)
            );

          if (typeof tag.onMain === 'function')
            el$.click(tag.onMain);
            
          return el$;
          },
					tagInit = function (manager) {
  					jT.TagWidget.prototype.init.call(this, manager);
            manager.getListener("current").addWidget(this);
					},
					TagWidget = a$(Solr.Requesting, Solr.Faceting, jT.TagWidget);
          

		// Now the actual initialization of facet widgets
		$("#accordion .widget-content").each(function (idx){
			var me = $(this),
					hdr = me.closest(".widget-root").prev(),
					fid = me.data("facet"),
					col = me.data("color"),
					f = Facets[fid];
					
			if (!f) {
				console.log("Referred a missing widget: " + fid);
				return;
			}
      me.addClass(f.color = col || f.color);
			
			Manager.addListeners(new TagWidget($.extend({
				id : fid,
				target : me,
				header: hdr,
				multivalue: true,
				aggregate: true,
				exclusion: true,
				useJson: true,
				renderTag: renderTag,
				init: tagInit,
				nesting: "type_s:substance",
				domain: { type: "parent", "which": "type_s:substance" }
			}, f)));
		});

		
		// ... add the mighty pivot widget.
/*
		Manager.addListeners(PivotWidget = new jT.PivotWidget({
			id : "studies",
			target : $(".after_topcategory"),

			pivotFields: [ "topcategory_s", "endpointcategory_s", "effectendpoint_s", "unit_s" ],
			facetFields: { endpointcategory_s: { color: "blue" }, effectendpoint_s: { color: "green" } },
			endpointField: "effectendpoint_s",
			unitField: "unit_s",
			statField: "loValue_d",
			
			multivalue: true,
			aggregate: true,
			exclusion: true,
			useJson: true,
			renderTag: renderTag,
			tabsRefresher: getTabsRefresher 
		}));
*/
		
    // ... And finally the current-selection one, and ...
    Manager.addListeners(new jT.CurrentSearchWidget({
			id : 'current',
			target : $('#selection'),
			renderTag : renderTag,
			useJson: true
		}));
		
		// ... auto-completed text-search.
		var textWidget = new (a$(Solr.Requesting, Solr.Texting, jT.AutocompleteWidget))({
			id : 'text',
			target : $('#search'),
			domain: { type: "parent", which: "type_s:substance" },
			useJson: true,
			facetFields : Facets,
			SpyManager: a$(Solr.Configuring, Solr.QueryingURL)
		});
		
		Manager.addListeners(textWidget);
		
		// Now add the basket.
		Basket = new (a$(jT.ListWidget, jT.ItemListWidget))({
			id : 'basket',
			target : $('#basket-docs'),
			settings : Settings,
  		summaryRenderers: Renderers,
  		itemId: "s_uuid",
			onClick : function (e, doc) {
				if (Basket.eraseItem(doc.s_uuid) === false) {
					console.log("Trying to remove from basket an inexistent entry: " + JSON.stringify(doc));
					return;
				}
				
				$(this).remove();
				var s = "", 
				    jel = $('a[href="#basket_tab"]'),
				    resItem = $("#result_" + doc.s_uuid);
				    
				jel.html(jT.ui.updateCounter(jel.html(), Basket.length));
				Basket.enumerateItems(function (d) { s += d.s_uuid + ";";});
				if (!!(s = jT.ui.modifyURL(window.location.href, "basket", s)))
					window.history.pushState({ query : window.location.search }, document.title, s);
							
       		if (resItem.length > 0)
				  $("footer", resItem[0]).toggleClass("add none");
			},
			onCreated: function (doc) {
				$("footer", this).addClass("remove");
			}			
		});
		
		Manager.init();
		
		// now get the search parameters passed via URL
		textWidget.set($.url().param('search') || '');
		Manager.doRequest();

		// Set some general search machanisms for links among the results / text.
		$(document).on('click', "a.freetext_selector", function (e) {
  		textWidget.set(this.innerText);
  		Manager.doRequest();
		});
	});
})(Solr, asSys, jQuery, jToxKit);
