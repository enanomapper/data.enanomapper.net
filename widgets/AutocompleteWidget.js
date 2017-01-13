(function (Solr, a$, $, jT) {

jT.AutocompleteWidgeting = function (settings) {
  var self = this;
  a$.extend(true, self, settings);
  
  this.customResponse = function (response) {
    var list = [];
    for (var i = 0; i < self.fields.length; i++) {
      var field = self.fields[i];
      for (var facet in response.facet_counts.facet_fields[field]) {
        list.push({
          field: field,
          value: facet,
          label: facet + ' (' + response.facet_counts.facet_fields[field][facet] + ') - ' + field
        });
      }
    }
    
    self.reportCallback(list);
  };
  
  this.delayed = null;
};

jT.AutocompleteWidgeting.prototype = {
  __expects: [ "doRequest", "set", "doRequest" ],
  
  afterRequest: function () {
    var self = this,
        findbox = this.target.find('input'),
        autobox = findbox.autocomplete({
          'source': function (request, response) {
            self.reportCallback = response;
            self.set(request.term);
            self.doRequest();
          },
          'select': function(event, ui) {
            if (ui.item) {
              self.requestSent = true;
              if (self.manager.addParameter('fq', ui.item.field + ':' + Solr.escapeValue(ui.item.value))) {
                self.doRequest();
              }
            }
          }
        });
    
/*
    var params = [ 'rows=0&facet=true&facet.limit=-1&facet.mincount=1&json.nl=map' ];
    for (var i = 0; i < this.fields.length; i++) {
      params.push('facet.field=' + this.fields[i]);
    }
    
    var values = this.manager.getAllValues('fq');
    if (values != null) for (var i = 0; i < values.length; i++) {
      params.push('fq=' + encodeURIComponent(values[i]));
    }
*/
    
    var qval = this.manager.getParameter('q').value;
/*
    params.push('q=' + qval);
    $.getJSON(this.manager.solrUrl + 'autophrase?' + params.join('&') + '&wt=json&json.wrf=?', {}, callback);
*/
    
    if (qval != "*:*" && qval.length > 0)
      findbox.val(qval);
  }
};

jT.AutocompleteWidget = a$(Solr.Requesting, Solr.Delaying, Solr.Texting, jT.AutocompleteWidgeting);

})(Solr, asSys, jQuery, jToxKit);
