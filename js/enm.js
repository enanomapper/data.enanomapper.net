var	Settings = {
   		solrUrl: 'https://sandbox.ideaconsult.net/solr/nanoreg1test_shard1_replica1/',
      ambitUrl: 'https://apps.ideaconsult.net/nanoreg1/',
      multipleSelection: true,
      keepAllFacets: true,
      aggregateFacets: false,
    	listingFields: [ 
        "dbtag_hss",
        "name:name_hs", 
        "publicname:publicname_hs", 
        "owner_name:owner_name_hs",
        "substanceType:substanceType_hs",
        "s_uuid:s_uuid_hs",
        "content:content_hss",
        "SUMMARY.*"
      ],
      tagDbs: {
        "NNRG": {
          "server": "https://apps.ideaconsult.net/nanoreg1/",
          "icon": "http://www.nanoreg.eu/images/NANoREG_Logo_short.jpg"
        },
        "MRNA": {
          "server": "https://apps.ideaconsult.net/marina/"
        }
      },   
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
      pivot: [ 
			  { id: "topcategory", field: "topcategory_s", disabled: true, facet: { domain: { blockChildren: "type_s:substance" } } },
			  { id: "endpointcategory", field: "endpointcategory_s", color: "blue" },
			  { id: "effectendpoint", field: "effectendpoint_s", color: "green", ranging: true }, 
			  { id: "unit", field: "unit_s", disabled: true, ranging: true }
  	  ],
      facets: [ 
    		{ id: 'owner_name', field: "owner_name_s", title: "Data sources", color: "green", facet: { mincount: 450 } }, 
  			{ id: 'substanceType', field: "substanceType_s", title: "Nanomaterial type", facet: { mincount: 2, limit: -1 } },
    		{ id: 'cell', field: "Cell line_s", title: "Cell", color: "green", facet: { mincount: 1 } },
    		{ id: 'species', field: "Species_s", title: "Species", color: "blue", facet: { mincount: 2 } }, 
    		{ id: 'interpretation', field: "interpretation_result_s", title: "Results", facet: { mincount: 2 } }, 
    		{ id: 'reference_year', field: "reference_year_s", title: "References Years", color: "green", facet: { mincount: 1 } },
    		{ id: 'reference', field: "reference_s", title: "References", facet: { mincount: 2 } }, 
    		{ id: 'protocol', field: "guidance_s", title: "Protocols", color: "blue", facet: { mincount: 2 } },
      	],
    	exportLevels: {
      	'study': {
          domain: { type: 'parent', which: "study" },
          fieldsRegExp: /(loValue_d|unit_s|Species_s|Cell\\ line_s):/
      	}
    	},
      exportTypes: [
        { 
          name: "Material, composition and study",
          fields: "substance_uuid:s_uuid_hs,name:name_hs,publicname:publicname_hs,supplier:owner_name_hs,substanceType:substanceType_hs,[child parentFilter=type_s:substance childFilter=\"{{filter}} OR type_s:composition\" limit=10000]",
          defaultFilter:"type_s:study",
          formats: "json,csv,tsv,xslx,rdf,json-ld,isa-json",
        }, { 
          name: "Material identifiers",
          fields: "substance_uuid:s_uuid_hs,name:name_hs,publicname:publicname_hs,supplier:owner_name_hs,substanceType:substanceType_hs",
          formats: "json,csv,tsv"
        }, { 
          name: "Material composition",
          fields: "substance_uuid:s_uuid_hs,[child parentFilter=type_s:substance childFilter=type_s:composition limit=1000]",
          formats: "json,csv,tsv"
        }, { 
          name: "Study results",
          fields: "substance_uuid:s_uuid_hs,[child parentFilter=type_s:study limit=10000]",
          extraParams: [ "group.field=s_uuid_s" ],
          formats: "json,csv,tsv",
          exportLevel: 'study'
        }, { 
          name: "Protocol parameters",
          fields: "substance_uuid:s_uuid_hs,[child parentFilter=type_s:study childFilter=type_s:params]",
          extraParams: [ "group.field=s_uuid_s" ],
          formats: "json,csv,tsv",
          exportLevel: "study"
        }, { 
          name: "Study factors",
          fields: "substance_uuid:s_uuid_hs,[child parentFilter=type_s:study childFilter=type_s:conditions]",
          extraParams: [ "group.field=s_uuid_s" ],
          formats: "json,csv,tsv",
          exportLevel: "study"
        }
      ],
  		exportFormats: [
        { mime: "application/json", name:"json", icon: "images/types/json64.png", server: 'solrUrl'},
        { mime: "text/csv", name:"csv", icon: "images/types/csv64.png", server: 'solrUrl'},
        { mime: "text/tsv", name:"tsv", icon: "images/types/txt64.png", server: 'solrUrl'},
        { mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", name:"xslx", icon: "images/types/xlsx.png", server: 'ambitUrl'},
        { mime: "application/rdf+xml", name:"rdf", icon: "images/types/rdf64.png", server: 'ambitUrl'},
        { mime: "application/ld+json", name:"json-ld", icon: "images/types/json-ld.png", server: 'ambitUrl'},
        { mime: "application/isa+json", name:"isa-json", icon: "images/types/isa.png", server: 'ambitUrl'}
      ]
		};