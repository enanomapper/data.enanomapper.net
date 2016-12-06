/** SolrJsX library - a neXt Solr queries JavaScript library.
  * Json querying skills - putting all appropriate parameters
  * for JSON based query.
  *
  * Author: Ivan Georgiev
  * Copyright © 2016, IDEAConsult Ltd.
  */
  

// TODO: This has never been verified, actually!
var renameParameter = function (name) {
  switch (name) {
    case 'fq': return 'filter';
    case 'q': return 'query';
    case 'fl': return 'fields';
    case 'rows': return 'limit';
    case 'start': return 'offset';
    case 'f': return 'facet';
    case 'ex': return 'excludeTags';
    default:
      var m = name.match(/^json\./);
      return !m ? null : name.substr(m[0].length);
  }
};

Solr.QueryingJson = function (obj) {
  a$.extend(true, this, obj);
};

Solr.QueryingJson.prototype = {
  __depends: [ Solr.QueryingURL ],
  
  prepareQuery: function () {
    var self = this,
        urlQuery = [],
        dataQuery = {};
    
    self.enumerateParameters(function (param) {
      var m = renameParameter(param.name);
      if (!m || typeof param.value !== 'object') {
        m = a$.act(this, Solr.QueryingURL.prototype.prepareParam, param);
        if (m != null)
          urlQuery.push(m);
      }
      // A JSON-valid parameter
      else
        a$.path(dataQuery, m, a$.extend({}, param.value, { domain: param.domain }));
    });
    
    console.log("Query URL: " + urlQuery.join("&") + " Data: " + JSON.stringify(dataQuery));
    return { url: '?' + urlQuery.join("&"), data: dataQuery };
  },
  
  parseQuery: function (response) {

  },
  
};
