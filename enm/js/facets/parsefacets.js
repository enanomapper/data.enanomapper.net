function SolrFacets(solrurl, keys) {
	this.flatfacets = [];
	this.url = solrurl === undefined ? "https://solr.ideaconsult.net/solr/nanoreg_shard1_replica1/select"
			: solrurl;
	this.ambiturl = "https://apps.ideaconsult.net/nanoreg1/";

	this.keys = keys === undefined ? [ "substanceType_s", "publicname_s",
			"name_s", "topcategory_s", "endpointcategory_s", "guidance_s",
			"E.cell_type_s", "E.exposure_time_s", "effectendpoint_s", "unit_s" ]
			: keys;

	this.parse = function(facets, level, item) {
		jitem = JSON.stringify(item);
		// console.log(level);
		if (level == 1 && facets["val"] == "") {
			return;
		}
		if (level >= this.keys.length) {
			citem = JSON.parse(jitem);
			// citem["level"] += "f";
			citem["level"] = level;

			this.flatfacets.push(citem);
			// console.log(JSON.stringify(this.flatfacets));
			return;
		}
		if (facets === undefined)
			return;
		if (level >= this.keys.length)
			return;

		key = FacetQuery.getFacetname(this.keys[level]);
		if (facets[key] === undefined)
			return;
		buckets = facets[key].buckets;
		missing = facets[key].missing;

		self = this;
		queryfacet = 0;
		if ((buckets != undefined)) {
			$.each(buckets, function(index, element) {
				citem = self.createItem(level, jitem, element,
						(element.val === undefined) ? "NA" : element.val);
			});
		} else
			queryfacet++;
		if (missing != undefined && (missing.count > 0)) {
			citem = this.createItem(level, jitem, missing, "-");
		} else
			queryfacet++;

	};

	this.createItem = function(level, jitem, element, value) {
		key = FacetQuery.getFacetname(this.keys[level]);
		citem = JSON.parse(jitem);
		citem["level"] = (level + 1);
		citem[key] = value;
		citem["count"] = element["count"];
		citem["min"] = element["minv"];
		citem["max"] = element["maxv"];
		citem["p50"] = element["p50"];
		this.parse(element, (level + 1), citem);
		return citem;
	};

	this.createTable = function(tableid, filter) {
		self = this;
		$(tableid)
				.DataTable(
						{
							"bDestroy" : true,
							"oButtons" : [ 'copy', 'csv', 'excel', 'pdf',
									'print' ],
							"sDom" : '<"helpremove-bottom"i><"help"p>Trt<"help"lf>',
							"bJQueryUI" : true,
							"bPaginate" : true,
							"sPaginationType" : "full_numbers",
							"sPaginate" : ".dataTables_paginate _paging",
							"bDeferRender" : true,
							"bSearchable" : true,
							"bSortable" : true,
							"sAjaxDataProp" : "facets",
							"bProcessing" : true,
							"sAjaxSource" : self.url,
							"fnServerData" : function(sSource, aoData,
									fnCallback, oSettings) {
								fq = JSON.stringify(FacetQuery.createDefault());
								console.log(fq);
								oSettings.jqXHR = $
										.ajax({
											"dataType" : 'json',
											"type" : "POST",
											"url" : sSource,
											"cache" : false,
											"data" : "rows=0&wt=json&fq="
													+ filter
													+ "&q={!parent which=type_s:study}&json.facet="
													+ fq,
											"success" : function(result) {
												// console.log(result);
												self.parse(result.facets, 0, {
													level : "0"
												});
												fnCallback({
													"facets" : self.flatfacets
												});

											},
										});
							},
							aoColumnDefs : [
									{
										"sTitle" : "Type",
										aTargets : [ 0 ],
										"mDataProp" : FacetQuery
												.getFacetname(self.keys[0]),
										"mRender" : function(data, type, full) {
											return (data === undefined || data == "") ? ""
													: lookup[data];
										},
										"sDefaultContent" : ""
									},
									{
										"sTitle" : "ID",
										aTargets : [ 1 ],
										"mDataProp" : FacetQuery
												.getFacetname(self.keys[1]),
										"sDefaultContent" : "",

										"mRender" : function(data, type, full) {
											var href = self.ambiturl
													+ "substance?type=name&search="
													+ data;
											return "<a href='" + href
													+ "' target='ambit'>"
													+ data + "</a>";
										},

									},
									{
										"sTitle" : "Name",
										aTargets : [ 2 ],
										"mDataProp" : FacetQuery
												.getFacetname(self.keys[2]),

										"sDefaultContent" : ""
									},
									{
										"sTitle" : "Study type",
										aTargets : [ 3 ],
										"mDataProp" : FacetQuery
												.getFacetname(self.keys[4]),
										"mRender" : function(data, type, full) {
											return (data === undefined || data == "") ? ""
													: lookup[data];
										},
										"sDefaultContent" : ""
									},
									{
										"sTitle" : "Method",
										aTargets : [ 4 ],
										"mDataProp" : FacetQuery
												.getFacetname(self.keys[5]),
										"sDefaultContent" : ""
									},
									{
										"sTitle" : "Cell type",
										aTargets : [ 5 ],
										"mDataProp" : FacetQuery
												.getFacetname(self.keys[6]),
										"sDefaultContent" : ""
									},
									{
										"sTitle" : "Time",
										aTargets : [ 6 ],
										"mDataProp" : FacetQuery
												.getFacetname(self.keys[7]),
										"sDefaultContent" : ""
									},
									{
										"sTitle" : "Parameter",
										aTargets : [ 7 ],
										"mDataProp" : FacetQuery
												.getFacetname(self.keys[8]),
										"sDefaultContent" : ""
									},

									{
										"sTitle" : "Min",
										aTargets : [ 8 ],
										"mDataProp" : "min",
										"mRender" : function(data, type, full) {
											return Number(data).toFixed(3);
										},
										"sDefaultContent" : ""
									},
									{
										"sTitle" : "p50",
										aTargets : [ 9 ],
										"mDataProp" : "p50",
										"mRender" : function(data, type, full) {
											return Number(data).toFixed(3);
										},
										"sDefaultContent" : ""
									},

									{
										"sTitle" : "Max",
										aTargets : [ 10 ],
										"mDataProp" : "max",
										"mRender" : function(data, type, full) {
											return Number(data).toFixed(3);
										},
										"sDefaultContent" : ""
									},
									{
										"sTitle" : "Unit",
										aTargets : [ 11 ],
										"mDataProp" : FacetQuery
												.getFacetname(self.keys[9]),
										"sDefaultContent" : ""
									},

									{
										"sTitle" : "# studies",
										aTargets : [ 12 ],
										"mDataProp" : "count",
										"sDefaultContent" : ""
									} ]

						});
	}

	this.createTable_1_10 = function(tableid, filter) {
		self = this;
		$(tableid)
				.DataTable(
						{
							"bDestroy" : true,
							"buttons" : [ 'csv', 'excel' ],
							//"sDom" : '<"helpremove-bottom"i><"help"p>Trt<"help"lf>',
							dom: 'Bfrtip',
							"bJQueryUI" : true,
							"bPaginate" : true,
							"sPaginationType" : "full_numbers",
							"sPaginate" : ".dataTables_paginate _paging",
							"bDeferRender" : true,
							"bSearchable" : true,
							"bSortable" : true,
							"sAjaxDataProp" : "facets",
							"bProcessing" : true,
							"sAjaxSource" : self.url,
							"fnServerData" : function(sSource, aoData,
									fnCallback, oSettings) {
								fq = JSON.stringify(FacetQuery.createDefault());
								console.log(fq);
								oSettings.jqXHR = $
										.ajax({
											"dataType" : 'json',
											"type" : "POST",
											"url" : sSource,
											"cache" : false,
											"data" : "rows=0&wt=json&fq="
													+ filter
													+ "&q={!parent which=type_s:study}&json.facet="
													+ fq,
											"success" : function(result) {
												// console.log(result);
												self.parse(result.facets, 0, {
													level : "0"
												});
												fnCallback({
													"facets" : self.flatfacets
												});

											},
										});
							},
							aoColumnDefs : [
									{
										"sTitle" : "Type",
										aTargets : [ 0 ],
										"mDataProp" : FacetQuery
												.getFacetname(self.keys[0]),
										"mRender" : function(data, type, full) {
											return (data === undefined || data == "") ? ""
													: lookup[data];
										},
										"sDefaultContent" : ""
									},
									{
										"sTitle" : "ID",
										aTargets : [ 1 ],
										"mDataProp" : FacetQuery
												.getFacetname(self.keys[1]),
										"sDefaultContent" : "",

										"mRender" : function(data, type, full) {
											var href = self.ambiturl
													+ "substance?type=name&search="
													+ data;
											return "<a href='" + href
													+ "' target='ambit'>"
													+ data + "</a>";
										},

									},
									{
										"sTitle" : "Name",
										aTargets : [ 2 ],
										"mDataProp" : FacetQuery
												.getFacetname(self.keys[2]),

										"sDefaultContent" : ""
									},
									{
										"sTitle" : "Study type",
										aTargets : [ 3 ],
										"mDataProp" : FacetQuery
												.getFacetname(self.keys[4]),
										"mRender" : function(data, type, full) {
											return (data === undefined || data == "") ? ""
													: lookup[data];
										},
										"sDefaultContent" : ""
									},
									{
										"sTitle" : "Method",
										aTargets : [ 4 ],
										"mDataProp" : FacetQuery
												.getFacetname(self.keys[5]),
										"sDefaultContent" : ""
									},
									{
										"sTitle" : "Cell type",
										aTargets : [ 5 ],
										"mDataProp" : FacetQuery
												.getFacetname(self.keys[6]),
										"sDefaultContent" : ""
									},
									{
										"sTitle" : "Time",
										aTargets : [ 6 ],
										"mDataProp" : FacetQuery
												.getFacetname(self.keys[7]),
										"sDefaultContent" : ""
									},
									{
										"sTitle" : "Parameter",
										aTargets : [ 7 ],
										"mDataProp" : FacetQuery
												.getFacetname(self.keys[8]),
										"sDefaultContent" : ""
									},

									{
										"sTitle" : "Min",
										aTargets : [ 8 ],
										"mDataProp" : "min",
										"mRender" : function(data, type, full) {
											return Number(data).toFixed(3);
										},
										"sDefaultContent" : ""
									},
									{
										"sTitle" : "p50",
										aTargets : [ 9 ],
										"mDataProp" : "p50",
										"mRender" : function(data, type, full) {
											return Number(data).toFixed(3);
										},
										"sDefaultContent" : ""
									},

									{
										"sTitle" : "Max",
										aTargets : [ 10 ],
										"mDataProp" : "max",
										"mRender" : function(data, type, full) {
											return Number(data).toFixed(3);
										},
										"sDefaultContent" : ""
									},
									{
										"sTitle" : "Unit",
										aTargets : [ 11 ],
										"mDataProp" : FacetQuery
												.getFacetname(self.keys[9]),
										"sDefaultContent" : ""
									},

									{
										"sTitle" : "# studies",
										aTargets : [ 12 ],
										"mDataProp" : "count",
										"sDefaultContent" : ""
									} ]

						});
	}
}

SolrFacets.doSummary = function(url, topcategory) {
	tableid = '#summary';
	try {
		table = $(tableid).DataTable({
			bRetrieve : true,
			paging : false
		});
		// console.log(table);
		//if (table!= null && table != undefined) table.fnDestroy();
	} catch (err) {

	}
	var solrFacets = new SolrFacets(url,this.keys);
	solrFacets.createTable_1_10(tableid, "topcategory_s:" + topcategory);
}

function FacetQuery(field, type, domain, missing, facet) {
	this.type = type === undefined ? "terms" : type;
	this.field = field;
	this.domain = domain;
	this.missing = missing;
	this.facet = facet;

	this.createFacet = function() {
		var map = {};
		name = FacetQuery.getFacetname(this.field);
		map[name] = this;
		return map;
	}
}
FacetQuery.getFacetname = function(field) {
	return field===undefined?null:("f_" + field.replace("_s", "").replace("\.", "_").replace("_", "")
			.toLowerCase());
}
FacetQuery.createStudyDomain = function() {
	return {
		"blockParent" : "type_s:study"
	};
}

FacetQuery.createParamsDomain = function() {
	return {
		"blockParent" : "type_s:params"
	};
}

FacetQuery.createDefault = function() {
	facet_unit = new FacetQuery("unit_s", "terms", FacetQuery
			.createStudyDomain(), true, {
		minv : "min(loValue_d)",
		p50 : "percentile(loValue_d,50)",
		maxv : "max(loValue_d)"
	});

	facet_endpoint = new FacetQuery("effectendpoint_s", "terms", FacetQuery
			.createStudyDomain(), false, facet_unit.createFacet());

	facet_time = new FacetQuery("E.exposure_time_s", "terms", FacetQuery
			.createParamsDomain(), true, facet_endpoint.createFacet());

	facet_cell = new FacetQuery("E.cell_type_s", "terms", FacetQuery
			.createParamsDomain(), true, facet_time.createFacet());

	facet_guidance = new FacetQuery("guidance_s", "terms", undefined,
			undefined, facet_cell.createFacet());

	facet_endpointcategory = new FacetQuery("endpointcategory_s", "terms",
			undefined, undefined, facet_guidance.createFacet());

	facet_topcategory = new FacetQuery("topcategory_s", "terms", undefined,
			undefined, facet_endpointcategory.createFacet());

	/*
	 * doesn't work yet facet_topcategory = new FacetQuery("topcategory_s",
	 * "query", undefined, undefined, facet_endpointcategory.createFacet());
	 * facet_topcategory["q"] = "topcategory_s:TOX";
	 */

	facet_name = new FacetQuery("name_s", "terms", FacetQuery
			.createStudyDomain(), undefined, facet_topcategory.createFacet());

	facet_pname = new FacetQuery("publicname_s", "terms", FacetQuery
			.createStudyDomain(), undefined, facet_name.createFacet());

	var facet_substance = new FacetQuery("substanceType_s", "terms", FacetQuery
			.createStudyDomain(), undefined, facet_pname.createFacet());

	// console.log(JSON.stringify(facet_substance.createFacet()));
	return facet_substance.createFacet();
}