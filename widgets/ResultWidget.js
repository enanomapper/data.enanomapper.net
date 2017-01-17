(function (Solr, a$, $, jT) {

// Keep in mind that the field should be the same in all entries.

jT.ResultWidgeting = function (settings) {
  a$.extend(true, this, a$.common(settings, this));
};

jT.ResultWidgeting.prototype = {
  __expects: [ "populate" ],
  nestingRules: {
//       "study": { field: "type_s", parent: "substance", limit: 10 },
    "composition": { field: "type_s", parent: "substance", limit: 100 }
  },
  listingFields: [ 
    "name:name_hs", 
    "publicname:publicname_hs", 
    "owner_name:owner_name_hs",
    "substanceType:substanceType_hs",
    "s_uuid:s_uuid_hs",
    "content:content_hss",
    "SUMMARY.*"
  ],

  init: function (manager) {
    a$.pass(this, jT.ResultWidgeting, 'init', manager);
    this.manager = manager;
    
    a$.each(this.nestingRules, function (r, i) {
      manager.addParameter('fl', 
        "[child parentFilter=" + r.field + ":" + r.parent 
        + " childFilter=" + r.field + ":" + i 
        + " limit=" + r.limit + "]");
    });

    a$.each(this.listingFields, function (f) { manager.addParameter('fl', f)});    
  },
  
	beforeRequest : function() {
		$(this.target).html(
				$('<img>').attr('src', 'images/ajax-loader.gif'));
	},

	afterTranslation : function(data) {
		$(this.target).empty();
		this.populate(data.entries);
	}
};

jT.ResultWidget = a$(jT.ListWidgeting, jT.ItemListWidget, jT.ResultWidgeting);

})(Solr, asSys, jQuery, jToxKit);
