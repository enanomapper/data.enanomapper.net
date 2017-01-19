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
		Facets = [ 
  		{ id: 'owner_name', field: "owner_name_s", title: "Data sources", color: "green", facet: { mincount: 3 } }, 
			{ id: 'substanceType', field: "substanceType_s", title: "Nanomaterial type", facet: { mincount: 2, limit: -1 } },
  		{ id: 'cell', field: "Cell line_s", title: "Cell", color: "green", facet: { mincount: 1, domain: { blockChildren: "type_s:params" } } },
  		{ id: 'species', field: "Species_s", title: "Species", color: "green", facet: { mincount: 2 }, domain: { blockChildren: "type_s:params" } }, 
  		{ id: 'interpretation', field: "interpretation_result_s", title: "Results", facet: { mincount: 2 } }, 
  		{ id: 'reference_year', field: "reference_year_s", title: "References Years", color: "green", facet: { mincount: 1 } },
  		{ id: 'reference', field: "reference_s", title: "References", facet: { mincount: 2 } }, 
  		{ id: 'protocol', field: "guidance_s", title: "Protocols", color: "blue", facet: { mincount: 2 } },
/*
  		'instruments': 		{ field: "_childDocuments_.params.DATA_GATHERING_INSTRUMENTS" },
  		'testtype': '_childDocuments_.conditions.Test_type',
			'solvent' :	'_childDocuments_.conditions.Solvent',
			'route':	'_childDocuments_.params.Route_of_administration',
			'genotoxicity':	'_childDocuments_.params.Type_of_genotoxicity'
			*/
  	],
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

		initUI();
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
        tagRender = function (tag) {
          var view, title = view = tag.title.replace(/^\"(.+)\"$/, "$1");
              
          if (title.lastIndexOf("caNanoLab.", 0) == 0)
            view = title.replace("caNanoLab.","");
          else if (title.lastIndexOf("http://dx.doi.org/", 0) == 0)
            view = title.replace("http://dx.doi.org/", "");
          else
        	  view = (lookup[title] || title).replace(/NPO_|\s+nanoparticle/, "");
        	  
          var aux$ = $('<span/>').html(tag.count || 0);
          if (typeof tag.onAux === 'function')
            aux$.click(tag.onAux);
            
          var el$ = $('<li/>')
            .append($('<a href="#" class="tag" title="' + view + " " + (tag.hint || "") + ((title != view) ? ' [' + title + ']' : '') + '">' + view + '</a>')
              .append(aux$)
            );

          if (typeof tag.onMain === 'function')
            el$.click(tag.onMain);
          if (tag.color)
            el$.addClass(tag.color);
            
          return el$;
        },
        tagInit = function (manager) {
					jT.TagWidget.prototype.init.call(this, manager);
          manager.getListener("current").registerWidget(this);
				},
				tagsUpdated = function (total) {
  				var hdr = this.getHeaderText();
          hdr.textContent = jT.ui.updateCounter(hdr.textContent, total);
          a$.act(this, this.header.data("refreshPanel"));
				},
				TagWidget = a$(Solr.Requesting, Solr.Faceting, jT.AccordionExpansion, jT.TagWidget),
				Accordion = $("#accordion");
          

		// Now the actual initialization of facet widgets
		for (var i = 0, fl = Facets.length; i < fl; ++i) {
			var f = Facets[i],
			    w = new TagWidget($.extend({
    				target : Accordion,
    				expansionTemplate: "#tab-topcategory",
    				subtarget: "ul",
    				multivalue: true,
    				aggregate: true,
    				exclusion: true,
    				useJson: true,
    				renderItem: tagRender,
    				init: tagInit,
    				onUpdated: tagsUpdated,
    				nesting: "type_s:substance",
    				domain: { type: "parent", "which": "type_s:substance" },
    				classes: f.color
    			}, f))
      
      w.afterTranslation = function (data) { 
        this.populate(this.getFacetCounts(data.facets)); 
      };
			    
			Manager.addListeners(w);
		};

		
		// ... add the mighty pivot widget.
		Manager.addListeners(new jT.PivotWidget({
			id : "studies",
			target : Accordion,
      subtarget: "ul",
			expansionTemplate: "#tab-topcategory",
			before: "#cell_header",
			
			pivot: [ 
			  { id: "topcategory", field: "topcategory_s", disabled: true },
			  { id: "endpointcategory", field: "endpointcategory_s", color: "blue" },
			  { id: "effectendpoint", field: "effectendpoint_s", color: "green" }, 
			  { id: "unit", field: "unit_s", disabled: true }
      ],
      statistics: { 'min': "min(loValue_d)", 'max': "max(loValue_d)", 'avg': "avg(loValue_d)" },
      formatter: "{{loValue_d:0.01}}&nbsp;{{unit_s:formatUnits}}",
			
			multivalue: true,
			aggregate: true,
			exclusion: true,
			useJson: true,
			renderTag: tagRender,
			target: Accordion,
			classes: "dynamic-tab",
			nesting: "type_s:substance",
      domain: { type: "parent", "which": "type_s:substance" }
		}));
		
    // ... And finally the current-selection one, and ...
    Manager.addListeners(new jT.CurrentSearchWidget({
			id : 'current',
			target : $('#selection'),
			renderItem : tagRender,
			useJson: true
		}));
		
		// ... auto-completed text-search.
		var textWidget = new (a$(Solr.Requesting, Solr.Texting, jT.AutocompleteWidget))({
			id : 'text',
			target : $('#search'),
			domain: { type: "parent", which: "type_s:substance" },
			useJson: true,
			groups : Facets,
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
		textWidget.addValue($.url().param('search') || '');
		Manager.doRequest();

		// Set some general search machanisms for links among the results / text.
		$(document).on('click', "a.freetext_selector", function (e) {
  		textWidget.set(this.innerText);
  		Manager.doRequest();
		});
	});
	
})(Solr, asSys, jQuery, jToxKit);
