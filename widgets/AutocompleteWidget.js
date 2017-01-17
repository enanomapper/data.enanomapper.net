(function (Solr, a$, $, jT) {

var defaultParameters = {
  'facet': true,
  'rows': 0,
  'fl': "id",
  'facet.limit': -1,
  'facet.mincount': 1,
  'json.nl': "map",
  'echoParams': "none"
};
  
jT.AutocompleteWidgeting = function (settings) {
  a$.extend(true, this, a$.common(settings, this));
  this.target = settings.target;
  this.delayed = null;
  this.fqName = this.useJson ? "json.filter" : "fq";

  this.spyManager = new (a$(Solr.Configuring, Solr.QueryingURL))({ parameters: a$.extend(true, defaultParameters, settings.parameters) });
  var self = this;
  
  a$.each(settings.facetFields, function (facet, id) {
    self.spyManager.addParameter('facet.field', facet.field, a$.extend(true, { key: id }, facet.facet.domain));
  });
};

jT.AutocompleteWidgeting.prototype = {
  __expects: [ "doRequest", "set" ],
  servlet: "autophrase",
  useJson: false,
  maxResults: 30,
  facetFields: {},
  
  init: function (manager) {
    a$.pass(this, jT.AutocompleteWidgeting, "init", manager);
    this.manager = manager;
    
    var self = this;
    
    // now configure the independent free text search.
    self.findBox = this.target.find('input').on("change", function (e) {
      var thi$ = $(this);
      if (!self.set(thi$.val()) || self.requestSent)
        return;
        
      thi$.blur().autocomplete("disable");
      self.manager.doRequest();
    });
       
    // configure the auto-complete box. 
    self.findBox.autocomplete({
      'minLength': 0,
      'source': function (request, callback) {
        self.reportCallback = callback;
        self.makeRequest(request.term, function (response) { 
          self.onResponse(response); 
        }, function (jxhr, status, err) {
          callback([ "Err : '" + status + '!']);
        });
      },
      'select': function(event, ui) {
        if (ui.item) {
          self.requestSent = true;
          if (manager.getListener(ui.item.id).addValue(ui.item.value))
            manager.doRequest();
        }
      }
    });
  },
  
  makeRequest: function (term, success, error) {
    var self = this,
        fq = this.manager.getParameter(this.fqName);
        
    this.spyManager.removeParameters('fq');
    for (var i = 0, fql = fq.length; i < fql; ++i)
      this.spyManager.addParameter('fq', fq[i].value);
    
    this.spyManager.addParameter('q', term || "*:*");
    
    var settings = a$.extend(settings, this.manager.ajaxSettings, this.spyManager.prepareQuery());
    settings.url = this.manager.solrUrl + (this.servlet || this.manager.servlet) + settings.url + "&wt=json&json.wrf=?";
    settings.success = success;
    settings.error = error;
    
    return this.manager.connector.ajax( settings );
  },
  
  onResponse: function (response) {
    var self = this,
        list = [];
        
    a$.each(this.facetFields, function (f, id) {
      if (list.length >= self.maxResults)
        return;
        
      for (var facet in response.facet_counts.facet_fields[id]) {
        list.push({
          id: id,
          value: facet,
          label: (lookup[facet] || facet) + ' (' + response.facet_counts.facet_fields[id][facet] + ') - ' + id
        });
        
        if (list.length >= self.maxResults)
          break;
      }
    });
    
    if (typeof this.reportCallback === "function")
      self.reportCallback(list);
  },
    
  afterRequest: function (response) {
    var qval = this.manager.getParameter('q').value;
    this.findBox.val(qval != "*:*" && qval.length > 0 ? qval : "").autocomplete("enable");
    this.requestSent = false;
  }
};

jT.AutocompleteWidget = a$(Solr.Requesting, Solr.Texting, Solr.Listing, jT.AutocompleteWidgeting);

})(Solr, asSys, jQuery, jToxKit);
