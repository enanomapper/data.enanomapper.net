/** SolrJsX library - a neXt Solr queries JavaScript library.
  * URL querying skills - stacking up all parameters for URL-baesd query.
  *
  * Author: Ivan Georgiev
  * Copyright © 2016, IDEAConsult Ltd. All rights reserved.
  */
  
Solr.QueryingURL = function (obj) {
  a$.extend(true, this, obj);
};

var paramValue = function (value) {
  if (Array.isArray(value))
    return value.join(",");
  else if (typeof value !== 'object')
    return value.toString(); 
  else {
    var str = [];
    a$.each(value, function (v, k) { str.push(k + ":" + Solr.escapeValue(v)); });
    return str.join(" ");
  }
}

Solr.QueryingURL.prototype = {
  prepareParameter: function (param) {
    var prefix = [];
        
    a$.each(param.domain, function (l, k) {  prefix.push((k !== 'type' ? k + '=' : '') + l); });
    prefix = prefix.length > 0 ? "{!" + prefix.join(" ") + "}" : "";
    
    // For dismax request handlers, if the q parameter has local params, the
    // q parameter must be set to a non-empty value.
    return param.value || prefix ? param.name + "=" + encodeURIComponent(prefix + paramValue(param.value || (param.name == 'q' && "*:*"))) : null;
  },
  
  prepareQuery: function () {
    var query = [],
        self = this;
        
    this.enumerateParameters(function (param) {
      var p = self.prepareParameter(param);
      if (p != null)
        query.push(p);
    });
    
    return { url: '?' + query.join("&") };
  },
  
  parseQuery: function (response) {

  },
  
};
