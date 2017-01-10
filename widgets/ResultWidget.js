(function (Solr, a$, $, jT) {

// Keep in mind that the field should be the same in all entries.
var defaultRules = {
  "study": { field: "type_s", parent: "substance", limit: 100 },
  "composition": { field: "type_s", parent: "substance", limit: 100 }
};

jT.ResultWidgeting = function (settings) {
  this.nestingRules = a$.extend(true, {}, defaultRules, settings && settings.nestingRules);
};

jT.ResultWidgeting.prototype = {
  __expects: [ "populate" ],

  init: function (manager) {
    a$.pass(this, jT.ResultWidgeting, 'init', manager);
    this.manager = manager;
    
    a$.each(this.nestingRules, function (r, i) {
      manager.addParameter('fl', 
        "[child parentFilter=" + r.field + ":" + r.parent 
        + " childFilter=" + r.field + ":" + i 
        + " limit=" + r.limit + "]");
    });
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

jT.ResultWidget = a$(jT.ItemListWidget, jT.ResultWidgeting);

})(Solr, asSys, jQuery, jToxKit);
