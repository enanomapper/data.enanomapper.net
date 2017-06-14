_exportSettings = {
		"serverURL" :"https://solr.ideaconsult.net/solr/nanoreg_shard1_replica1/select",
		"params" : null
}       
	            
function SolrExport(solrurl) {
	
	this.url = solrurl === undefined ? "https://solr.ideaconsult.net/solr/nanoreg_shard1_replica1/select"
			: solrurl;
	this.f_substance = [ "document_uuid_s", "dbtag_hss", "substanceType_hs",
			"name_hs", "publicname_hs", "owner_name_hs" ];
	this.f_study = [ "reference_owner_s", "topcategory_s",
			"endpointcategory_s", "guidance_s", "effectendpoint_s",
			"loQualifier_s", "loValue_d", "upQualifier_s", "upValue_d",
			"unit_s", "errQualifier_s", "err_d" ];

	this.f_params = [ "Dispersion protocol_s", "MEDIUM_s", "E.method_s",
			"E.cell_type_s", "E.exposure_time_hour_s" ];

	this.tableColumns = function() {
		var cols = [];
		var i = 0;
		$.each(this.f_substance, function(index, key) {
			cols.push({
				sTitle : key.replace("_hs", ""),
				aTargets : [ i ],
				mDataProp : key,
				sDefaultContent : ""
			});
			i++;
		});
		$.each(this.f_params, function(index, key) {
			k = key.replace(".", "_");
			cols.push({
				sTitle : k.replace("_s", ""),
				aTargets : [ i ],
				mDataProp : k,
				sDefaultContent : ""
			});
			i++;
		});
		$.each(this.f_study, function(index, key) {

			cols.push({
				sTitle : key.replace("_s", ""),
				aTargets : [ i ],
				mDataProp : key,
				sDefaultContent : ""
			});
			i++;
		});
		return cols;
	}

	// this.dataquery =
	// "fl=dbtag_hss,substanceType_hs,owner_name_hs,name_hs,publicname_hs,substance_uuid:s_uuid_hs,[child%20parentFilter=type_s:substance%20childFilter=%22type_s:study%20OR%20type_s:params%20OR%20type_s:conditions%22
	// limit=20000]&q={!parent%20which=type_s:substance}gold&rows=100&wt=json";

	this.dataquery = function() {
		var params = {
			"fl" : "dbtag_hss,substanceType_hs,owner_name_hs,name_hs,publicname_hs,substance_uuid:s_uuid_hs,[child parentFilter=type_s:substance limit=10]",
			"q" : "{!parent which=type_s:substance}gold",
			"rows" : "1",
			"wt" : "json"
		};
		var q = [];
		$.each(params, function(index, key) {
			q.push(encodeURIComponent(index) + "=" + encodeURIComponent(key));
		});

		return q.join("&");
	}

	this.createTable = function(tableid,dataquery) {
		self = this;

		$(tableid)
				.DataTable(
						{
							"bDestroy" : true,
							"buttons" : [ 'csv', 'excel' ],
							// "sDom" :
							// '<"helpremove-bottom"i><"help"p>Trt<"help"lf>',
							dom : 'Bfrtip',
							"scrollY" : true,
							"scrollX" : true,
							"bJQueryUI" : true,
							"bPaginate" : true,
							"sPaginationType" : "full_numbers",
							"sPaginate" : ".dataTables_paginate _paging",
							"bDeferRender" : true,
							"bSearchable" : true,
							"bSortable" : true,
							"sAjaxDataProp" : "docs",
							"bProcessing" : true,
							"sAjaxSource" : self.url,
							"fnServerParams" : function(data) {
								// console.log(data);
							},
							"fnServerData" : function(sSource, aoData,
									fnCallback, oSettings) {
								console.log(dataquery);
								oSettings.jqXHR = $
										.ajax({
											"dataType" : 'json',
											"type" : "GET",
											"url" : sSource,
											"cache" : false,
											"data" : dataquery,
											"success" : function(result) {
												var docs = [];
												if (result.response.docs != undefined)
													$
															.each(
																	result.response.docs,
																	function(
																			index,
																			substance) {
																		prm_lookup = {};
																		if (substance._childDocuments_ != undefined) {

																			// params
																			$
																					.each(
																							substance._childDocuments_,
																							function(
																									index,
																									sdoc) {
																								if (sdoc.type_s == "params") {
																									var prm = [];
																									self
																											.copyFields(
																													self.f_params,
																													sdoc,
																													prm);
																									prm["document_uuid_s"] = sdoc["document_uuid_s"];
																									prm_lookup[sdoc["document_uuid_s"]] = prm;

																								}

																							});
																			// study
																			$
																					.each(
																							substance._childDocuments_,
																							function(
																									index,
																									sdoc) {
																								if (sdoc.type_s == "study") {
																									var doc = [];
																									doc["document_uuid_s"] = sdoc["document_uuid_s"];
																									self
																											.copyFields(
																													self.f_substance,
																													substance,
																													doc);
																									self
																											.copyFields(
																													self.f_study,
																													sdoc,
																													doc);

																									var prm = prm_lookup[sdoc["document_uuid_s"]];
																									if (prm != null) {
																										self
																												.copyFields(
																														self.f_params,
																														prm,
																														doc,
																														true);
																									}

																									docs
																											.push(doc);
																								}

																							});

																		}

																	});
												fnCallback({
													"docs" : docs
												});

											},

										});
							},
							aoColumnDefs : self.tableColumns(),
						});
	}

	this.copyFields = function(fields, source, target, nodot) {
		// the datatable doesn't like dots in column name...
		$.each(fields, function(index, key) {
			if (source[key] != undefined) {
				k = key;
				if (nodot != undefined && nodot)
					k = key.replace(".", "_");
				target[k] = source[key];
			}
		});

	}
}
