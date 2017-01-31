var	Settings = {
      ambitURL: 'https://apps.ideaconsult.net/nanoreg1/',
		  solrUrl: 'https://sandbox.ideaconsult.net/solr/nanoreg1test_shard1_replica1/',

    	listingFields: [ 
        "name:name_hs", 
        "publicname:publicname_hs", 
        "owner_name:owner_name_hs",
        "substanceType:substanceType_hs",
        "s_uuid:s_uuid_hs",
        "content:content_hss",
        "SUMMARY.*"
      ],
      summaryRenderers: {
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
      facets: [ 
    		{ id: 'owner_name', field: "reference_owner_s", title: "Data sources", color: "green", facet: { mincount: 1 } }, 
  			{ id: 'substanceType', field: "substanceType_s", title: "Nanomaterial type", facet: { mincount: 2, limit: -1 } },
  			    		
    		{ id: 'cell', field: "E.cell_type_s", title: "Cell", color: "green", facet: { mincount: 1, domain: { blockChildren: "type_s:params" } } },
    		{ id: 'species', field: "Species_s", title: "Species", color: "blue", facet: { mincount: 2, domain: { blockChildren: "type_s:params" } } }, 
	  		{ id: 'interpretation', field: "MEDIUM_s", title: "Medium", color: "green", facet: { mincount: 1, domain: { blockChildren: "type_s:params" } } },
  		  { id: 'dprotocol', field: "Dispersion protocol_s", title: "Dispersion protocol", color: "green", facet: { mincount: 1 , domain: { blockChildren: "type_s:params" }} }, 
 		    		  		
    		{ id: 'reference_year', field: "reference_year_s", title: "Experiment year", color: "green", facet: { mincount: 1 } },
    		{ id: 'reference', field: "reference_s", title: "References", facet: { mincount: 2 } }, 
    		{ id: 'route', field: "E.exposure_route_s", title: "Exposure route", color: "green", facet: { mincount: 1 , domain: { blockChildren: "type_s:conditions" } }}, 
  			{ id: 'protocol', field: "guidance_s", title: "Protocols", color: "blue", facet: { mincount: 1 } },
				{ id: 'method', field: "E.method_s", title: "Method", color: "green", facet: { mincount: 1 , domain: { blockChildren: "type_s:params" }} } 
    	],
      exportType: [
        { type: "substance", fields: "substance_uuid:s_uuid_hs,name:name_hs,publicname:publicname_hs,supplier:owner_name_hs,substanceType:substanceType_hs"},
        { type: "composition", fields: "substance_uuid:s_uuid_hs,[childFilter=type_s:composition limit=100] "},
        { type: "study", fields: "substance_uuid:s_uuid_hs,[child parentFilter=type_s:substance childFilter=type_s:study ]"},
        { type: "params", fields: "substance_uuid:s_uuid_hs,[child parentFilter=type_s:substance childFilter=type_s:params ]"},
        { type: "conditions", fields: "substance_uuid:s_uuid_hs,[child parentFilter=type_s:substance childFilter=type_s:conditions]"}
      ],
  		exportFormats: [
        { mime: "application/json", name:"json", icon: "images/types/json64.png", server: 'solrUrl'},
        { mime: "text/csv", name:"csv", icon: "images/types/csv64.png", server: 'solrUrl'},
        { mime: "text/tsv", name:"tsv", icon: "images/types/txt64.png", server: 'solrUrl'},
        { mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", name:"xslx", icon: "images/types/xlsx.png", server: 'ambitURL'},
        { mime: "application/rdf+xml", name:"rdf", icon: "images/types/rdf64.png", server: 'ambitURL'},
        { mime: "application/ld+json", name:"json-ld", icon: "images/types/json-ld.png", server: 'ambitURL'},
        { mime: "application/isa+json", name:"isa-json", icon: "images/types/isa.png", server: 'ambitURL'}
 
      ],
    	onPreInit: function (manager) {
      	// ... auto-completed text-search.
      	var textWidget = new (a$(Solr.Requesting, Solr.Texting, jT.AutocompleteWidget))({
      		id : 'text',
      		target : $('#freetext'),
      		domain: { type: "parent", which: "type_s:substance" },
      		useJson: true,
      		groups : this.facets,
      		SpyManager: a$(Solr.Configuring, Solr.QueryingURL),
      		lookupMap: lookup
      	});
      	
      	manager.addListeners(textWidget);

      	// Set some general search machanisms
      	$(document).on('click', "a.freetext_selector", function (e) {
      		if (textWidget.addValue(this.innerText))
      		  manager.doRequest();
      	});
    		
    		jT.ui.attachKit(textWidget.target, textWidget);
    	}
      
		};
