var Manager, 
		Basket,
  	Parameters = {
			'facet.limit' : -1,
			'facet.mincount' : 1,
// 			'echoParams': "none", // enable this for release versions.
      // https://cwiki.apache.org/confluence/display/solr/Collapse+and+Expand+Results
			'fq' : "{!collapse field=s_uuid}",
			'fl' : 'id,type_s,s_uuid,doc_uuid,topcategory,endpointcategory,guidance,substanceType,name,publicname,reference,reference_owner,interpretation_result,reference_year,content,owner_name,P-CHEM.PC_GRANULOMETRY_SECTION.SIZE,CASRN.CORE,CASRN.COATING,CASRN.CONSTITUENT,CASRN.ADDITIVE,CASRN.IMPURITY,EINECS.CONSTITUENT,EINECS.ADDITIVE,EINECS.IMPURITY,ChemicalName.CORE,ChemicalName.COATING,ChemicalName.CONSTITUENT,ChemicalName.ADDITIVE,ChemicalName.IMPURITY,TradeName.CONSTITUENT,TradeName.ADDITIVE,TradeName.IMPURITY,COMPOSITION.CORE,COMPOSITION.COATING,COMPOSITION.CONSTITUENT,COMPOSITION.ADDITIVE,COMPOSITION.IMPURITY',
// 			'fl' : "id,type_s,s_uuid,doc_uuid,loValue,upValue,topcategory,endpointcategory,effectendpoint,unit,guidance,substanceType,name,publicname,reference,reference_owner,e_hash,err,interpretation_result,textValue,reference_year,content,owner_name",
			'json.nl' : "map",
			'expand' : true,
			'expand.rows' : 3,
			'q.alt': "*:*",
		},
		Facets = { 
			'substanceType': 	{ field: "substanceType", facet: { mincount: 2, limit: -1 } },
  		'owner_name': 		{ field: "owner_name", facet: { mincount: 3 } }, 
  		'reference': 			{ field: "reference", facet: { mincount: 2 } }, 
  		'reference_year': { field: "reference_year", facet: { mincount: 1 } },
  		'protocol': 			{ field: "guidance", facet: { mincount: 2 } },
  		'interpretation': { field: "interpretation_result", facet: { mincount: 2 } }, 
  		'species': 				{ field: "_childDocuments_.params.Species" }, 
  		'cell': 					{ field: "_childDocuments_.params.Cell_line", facet: { mincount: 1 } }, 
  		'instruments': 		{ field: "_childDocuments_.params.DATA_GATHERING_INSTRUMENTS" },
  		/*
  		'testtype': '_childDocuments_.conditions.Test_type',
			'solvent' :	'_childDocuments_.conditions.Solvent',
			'route':	'_childDocuments_.params.Route_of_administration',
			'genotoxicity':	'_childDocuments_.params.Type_of_genotoxicity'
			*/
  	},
  	PivotWidget = null;

(function(Solr, a$, $, jT) {
	$(function() {
  	var Settings = {
	//solrUrl : 'https://search.data.enanomapper.net/solr/enm_shard1_replica1/',
	//this is test server only    
		solrUrl : 'https://sandbox.ideaconsult.net/solr/enm_shard1_replica1/',
		root : "https://data.enanomapper.net/substance/",
		summaryProperty: "P-CHEM.PC_GRANULOMETRY_SECTION.SIZE",
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
		},
		exportFields: 'Ambit_InchiKey:s_uuid,doc_uuid,topcategory,endpointcategory,guidance,substanceType,name,publicname,reference,reference_owner,interpretation_result,reference_year,content,owner_name,P-CHEM.PC_GRANULOMETRY_SECTION.SIZE,CASRN.CORE,CASRN.COATING,CASRN.CONSTITUENT,CASRN.ADDITIVE,CASRN.IMPURITY,EINECS.CONSTITUENT,EINECS.ADDITIVE,EINECS.IMPURITY,ChemicalName.CORE,ChemicalName.COATING,ChemicalName.CONSTITUENT,ChemicalName.ADDITIVE,ChemicalName.IMPURITY,TradeName.CONSTITUENT,TradeName.ADDITIVE,TradeName.IMPURITY,COMPOSITION.CORE,COMPOSITION.COATING,COMPOSITION.CONSTITUENT,COMPOSITION.ADDITIVE,COMPOSITION.IMPURITY',
		exportMaxRows: 999999 //2147483647
		},
		Exports = [
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
		
	Manager = new (a$(Solr.Management, Solr.Configuring, Solr.QueryingJson, jT.Consumption, jT.RawSolrTranslation))(Settings);

    Manager.addConsumers(new jT.ResultWidget({
			id : 'result',
			target : $('#docs'),
			settings : Settings,
			onClick : function (e, doc, exp, widget) { 
				if (!Basket.findItem(doc)) {
					Basket.addItem(doc);
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
		}), 'result');

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
    		me.addClass(f.color = col || f.color);
			
			var tagWidget = new jT.TagWidget($.extend({
				id : fid,
				target : me,
				header: hdr,
				multivalue: true,
				aggregate: true,
				exclusion: true,
				useJson: false,
				renderTag: renderTag
			}, f));

			Manager.addConsumers( tagWidget, fid );
			Manager.addListeners( tagWidget );
		});


		
		// ... add the mighty pivot widget.
		Manager.addConsumers(PivotWidget = new jT.PivotWidget({
			id : "studies",
			target : $(".after_topcategory"),

			pivotFields: [ "topcategory", "endpointcategory", "effectendpoint", "unit" ],
			facetFields: { endpointcategory: { color: "blue" }, effectendpoint: { color: "green" } },
			endpointField: "effectendpoint",
			unitField: "unit",
			statField: "loValue",
			
			multivalue: true,
			aggregate: true,
			exclusion: true,
			renderTag: renderTag,
			tabsRefresher: getTabsRefresher 
		}), "studies" );
		
    // ... And finally the current-selection one, and ...
    	var currentsearch = new jT.CurrentSearchWidget({
			id : 'currentsearch',
			target : $('#selection'),
			renderTag : renderTag,
		});
		Manager.addConsumers(currentsearch, 'currentsearch');
		Manager.addListeners(currentsearch);

		// ... auto-completed text-search.
		Manager.addListeners(new jT.AutocompleteWidget({
			id : 'text',
			target : $('#search'),
			fields : [ 
			    'substanceType', 'effectendpoint', 'endpointcategory',
					'name', 'guidance', 'interpretation_result',
					'_childDocuments_.params.Species','_childDocuments_.params.Cell_line', 'reference',
					'_text_' ]
		}));
		
		// Now add the basket.
		Basket = new jT.ItemListWidget({
			id : 'basket',
			target : $('#basket-docs'),
			settings : Settings,
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
				if (!!(s = ccLib.modifyURL(window.location.href, "basket", s)))
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
		Manager.addParameter('q', $.url().param('search') || '*:*');
		Manager.doRequest();

		// Prepare the export tab
	    var exportEl = $("#export_tab div.data_types"),
	        updateButton = function (e) {
				var form = this.form,
				b = $("button", this.form);

				if (!form.export_dataset.value)
					b.button("option", "label", "No target dataset selected...");
				else if (!!form.export_type.value)
					b.button("enable").button("option", "label", "Download " + $("#export_dataset :radio:checked + label").text().toLowerCase() + " as " + this.form.export_type.value.toUpperCase());
				return b;
	        };
        
		for (var i = 0, elen = Exports.length; i < elen; ++i) {
			var el = jT.getFillTemplate("#export-type", Exports[i]);

			exportEl.append(el);
			$("a", el[0]).on("click", function (e) {
				var me = $(this);
				if (!me.hasClass("selected")) {
					var form = me.closest("form")[0],
					cont = me.closest("div.data_types"),
					mime = me.data("mime");

					form.export_type.value = mime = mime.substr(mime.indexOf("/") + 1);
					updateButton.call(form.export_type, e);

					$("div", cont[0]).removeClass("selected");
					cont.addClass("selected");
					me.closest(".jtox-fadable").addClass("selected");
				}
				return false;
			});
		}
    
		$("#export_dataset").buttonset();
		$("#export_dataset input").on("change", updateButton);
		$("#export_tab button").button({ disabled: true });
		$("#export_tab form").on("submit", function (e) {
			var form = this,
				mime = form.export_type.value,
				params = ['rows=' + Settings.exportMaxRows, 'fl=' + encodeURIComponent(Settings.exportFields)];

			if (mime == "tsv")
				params.push("wt=csv", "csv.separator=%09");
			else
				params.push('wt=' + mime);
	      
			if (form.export_dataset.value == "filtered") {
				var values = Manager.parameterStore.fq;

				for (var i = 0, vl = values.length; i < vl; i++) {
					if (!values[i].value.match(/collapse/))
					params.push('fq=' + encodeURIComponent(values[i].value));
				}

				form.q.value = Manager.parameterStore.q.value;
			}else { // i.e. selected
		        var fqset = [];
		        Basket.enumerateItems(function (d) { fqset.push(d.s_uuid); });
		        form.q.value = 's_uuid:(' + fqset.join(" ") + ')';
			}

			form.action = Manager.solrUrl + "select?" + params.join('&');
	      
			e.preventDefault();
			form.submit();
			return false;
		});

		$("#result-tabs").tabs( { 
			activate: function (e, ui) {
				if (ui.newPanel[0].id == 'export_tab') {
					$("div", ui.newPanel[0]).removeClass("selected");
					$("button", ui.newPanel[0]).button("disable").button("option", "label", "No output format selected...");

					var hasFilter = Manager.parameterStore.fq.length > 1 || Manager.parameterStore.q.value != '*:*';

					$("#selected_data")[0].disabled = Basket.length < 1;
					$("#selected_data")[0].checked = Basket.length > 0 && !hasFilter;
					$("#filtered_data")[0].disabled = !hasFilter;
					$("#filtered_data")[0].checked = hasFilter;

					$("#export_dataset").buttonset("refresh");
				}
			}
		});
		
		

		// Set some general search machanisms
		$(document).on('click', "a.freetext_selector", function (e) {
  		Manager.addParameter('q', Solr.escapeValue(this.innerText));
  		Manager.doRequest();
		});

		$(".query-left#query").sticky({topSpacing:10});
	});
})(Solr, asSys, jQuery, jToxKit);
