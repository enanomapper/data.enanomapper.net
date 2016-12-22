(function (Solr, a$, $, jT) {

jT.ResultWidgeting = function (settings) {
  a$.extend(this, settings);
};

jT.ResultWidgeting.prototype = {
  __depends: [ jT.ItemListWidget ],
  __expects: [ "populate" ],

  init: function (manager) {
    a$.pass(this, jT.ResultWidgeting, 'init', manager);
    this.manager = manager;
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

jT.ResultWidget = a$(jT.ResultWidgeting);

})(Solr, asSys, jQuery, jToxKit);
