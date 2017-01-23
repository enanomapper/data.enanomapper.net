var	Settings = {
  	//solrUrl: 'https://search.data.enanomapper.net/solr/enm_shard1_replica1/',
  	//this is test server only    
   		solrUrl: 'https://sandbox.ideaconsult.net/solr/enanondm_shard1_replica1/',
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
  		exportFields: "Ambit_InchiKey:s_uuid,doc_uuid,topcategory,endpointcategory,guidance,substanceType,name,publicname,reference,reference_owner,interpretation_result,reference_year,content,owner_name,P-CHEM.PC_GRANULOMETRY_SECTION.SIZE,CASRN.CORE,CASRN.COATING,CASRN.CONSTITUENT,CASRN.ADDITIVE,CASRN.IMPURITY,EINECS.CONSTITUENT,EINECS.ADDITIVE,EINECS.IMPURITY,ChemicalName.CORE,ChemicalName.COATING,ChemicalName.CONSTITUENT,ChemicalName.ADDITIVE,ChemicalName.IMPURITY,TradeName.CONSTITUENT,TradeName.ADDITIVE,TradeName.IMPURITY,COMPOSITION.CORE,COMPOSITION.COATING,COMPOSITION.CONSTITUENT,COMPOSITION.ADDITIVE,COMPOSITION.IMPURITY",
  		exportTypes: [
        { mime: "application/json", icon: "images/types/json64.png"},
        { mime: "text/csv", icon: "images/types/csv64.png"},
        { mime: "text/tsv", icon: "images/types/txt64.png"}
  /*
        { mime: "chemical/x-cml", icon: "images/types/cml64.png"},
        { mime: "chemical/x-mdl-sdfile", icon: "images/types/sdf64.png"},
        { mime: "chemical/x-daylight-smiles", icon: "images/types/smi64.png"},
        { mime: "chemical/x-inchi", icon: "images/types/inchi64.png"},
        { mime: "text/uri-list", icon: "images/types/lnk64.png"},
        { mime: "application/pdf", icon: "images/types/pdf64.png"},
        { mime: "application/rdf+xml", icon: "images/types/rdf64.png"}
  */
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

	$("#smartmenu" ).smartmenus();
	$(document).on("click", "ul.tag-group", function (e) { 
		$(this).toggleClass("folded");
		$(this).parents(".widget-root").data("refreshPanel").call();
	});
  
  $( "#about-message" ).dialog({
    modal: true,
    buttons: {
      Ok: function() {
        $( this ).dialog( "close" );
      }
    }
  });
  
  $( "#about-message" ).dialog("close");
  
  jT.ui.initialize();
  jT.ui.kit("freetext").addValue($.url().param('search') || '');
});
