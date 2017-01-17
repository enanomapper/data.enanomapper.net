(function (Solr, a$, $, jT) {

jT.TextWidgeting = function (settings) {
  a$.extend(true, this, a$.common(settings, this));
};

jT.TextWidgeting.prototype = {
  __expects: [ "doRequest", "set" ],

  delayed: 300,
  init: function (manager) {
    var self = this;
    a$.pass(this, jT.TextWidgeting, 'init', manager);

    $(this.target).find('input').bind('keydown', function(e) {
      if (e.which == 13) {
        var value = $(this).val();
        if (value && self.set(value)) {
          self.doRequest();
        }
      }
    });
  },

  afterRequest: function () {
    $(this.target).find('input').val('');
  }
};

jT.TextWidget = a$(Solr.Texting, jT.TextWidgeting);

})(Solr, asSys, jQuery, jToxKit);
