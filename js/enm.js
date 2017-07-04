var	Settings = {
   		solrUrl: 'https://solr.ideaconsult.net/solr/nanoreg_shard1_replica1/',
      ambitURL: 'https://apps.ideaconsult.net/nanoreg1/',
      multipleSelection: true,
      keepAllFacets: true,
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
      studyInnerFields: "topcategory_s, endpointcategory_s, guidance_s",
      facets: [ 
    		{ id: 'owner_name', field: "owner_name_s", title: "Data sources", color: "green", facet: { mincount: 450, domain: { blockChildren: "type_s:params" } } }, 
  			{ id: 'substanceType', field: "substanceType_s", title: "Nanomaterial type", facet: { mincount: 2, limit: -1, domain: { blockChildren: "type_s:params" } } },
    		{ id: 'cell', field: "Cell line_s", title: "Cell", color: "green", facet: { mincount: 1, domain: { blockChildren: "type_s:params" } } },
    		{ id: 'species', field: "Species_s", title: "Species", color: "blue", facet: { mincount: 2, domain: { blockChildren: "type_s:params" } } }, 
    		{ id: 'interpretation', field: "interpretation_result_s", title: "Results", facet: { mincount: 2, domain: { blockChildren: "type_s:params" } } }, 
    		{ id: 'reference_year', field: "reference_year_s", title: "References Years", color: "green", facet: { mincount: 1, domain: { blockChildren: "type_s:params" } } },
    		{ id: 'reference', field: "reference_s", title: "References", facet: { mincount: 2, domain: { blockChildren: "type_s:params" } } }, 
    		{ id: 'protocol', field: "guidance_s", title: "Protocols", color: "blue", facet: { mincount: 2, domain: { blockChildren: "type_s:params" } } },
      	],
      exportType: [
       { type: "Material, composition and study", fields: "*", childFilter:"", defaultChildFilter:"", formats: "json,csv,tsv,xslx,rdf,json-ld,isa-json"},
        { type: "Material identifiers", fields: "substance_uuid:s_uuid_hs,name:name_hs,publicname:publicname_hs,supplier:owner_name_hs,substanceType:substanceType_hs", childFilter:"", defaultChildFilter:"", formats: "json,csv,tsv"},
        { type: "Material composition", fields: "substance_uuid:s_uuid_hs", childFilter:"[childFilter={{childFilter}} limit=100]", defaultChildFilter:"type_s:composition", formats: "json"},
        { type: "Study results", fields: "substance_uuid:s_uuid_hs", childFilter:"[child parentFilter=type_s:substance childFilter={{childFilter}}]", defaultChildFilter:"type_s:study", formats: "json"},
        { type: "Protocol parameters", fields: "substance_uuid:s_uuid_hs", childFilter:"[child parentFilter=type_s:substance childFilter={{childFilter}} ]", defaultChildFilter:"type_s:params", formats: "json"},
        { type: "Study factors", fields: "substance_uuid:s_uuid_hs", childFilter:"[child parentFilter=type_s:substance childFilter={{childFilter}}]", defaultChildFilter:"type_s:conditions", formats: "json"}
      ],
  		exportFormats: [
        { mime: "application/json", name:"json", icon: "images/types/json64.png", server: 'solrUrl'},
        { mime: "text/csv", name:"csv", icon: "images/types/csv64.png", server: 'solrUrl'},
        { mime: "text/tsv", name:"tsv", icon: "images/types/txt64.png", server: 'solrUrl'},
        { mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", name:"xslx", icon: "images/types/xlsx.png", server: 'ambitURL'},
        { mime: "application/rdf+xml", name:"rdf", icon: "images/types/rdf64.png", server: 'ambitURL'},
        { mime: "application/ld+json", name:"json-ld", icon: "images/types/json-ld.png", server: 'ambitURL'},
        { mime: "application/isa+json", name:"isa-json", icon: "images/types/isa.png", server: 'ambitURL'}
 
      ]
		};