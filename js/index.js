var	Settings = {
  	//solrUrl: 'https://search.data.enanomapper.net/solr/enm_shard1_replica1/',
  	//this is test server only    
   		solrUrl: 'https://sandbox.ideaconsult.net/solr/enanondm_shard1_replica1/',
      ambitURL: 'https://apps.ideaconsult.net:443/enmtest/',
//       solrUrl: 'https://sandbox.ideaconsult.net/solr/nanoreg1ndm_shard1_replica1/',
//       solrUsername: "nanoreg1",
      
// 		  solrUrl: 'https://sandbox.ideaconsult.net/solr/enm_shard1_replica1/',
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
      		textWidget.set(this.innerText);
      		manager.doRequest();
      	});
    		
    		jT.ui.attachKit(textWidget.target, textWidget);
    	}
      
		};

$(document).ready(function(){

	$("#smartmenu").smartmenus();
  $("#about-message").dialog({
    modal: true,
    buttons: {
      Ok: function() {
        $( this ).dialog( "close" );
      }
    }
  });
  $("#about-message").dialog("close");
  
  jT.ui.initialize();
  var needle = $.url().param('search');
  if (!!needle)
    jT.ui.kit("freetext").addValue(needle);
});
