/** SolrJsX library - a neXt Solr queries JavaScript library.
  * Free text search skills.
  *
  * Author: Ivan Georgiev
  * Copyright © 2016, IDEAConsult Ltd. All rights reserved.
  */
  
Solr.Texting = function (obj) {
  a$.extend(true, this, obj);
  this.manager = null;
  this.delayTimer = null;
};

Solr.Texting.prototype = {
  delayed: false,       // Number of milliseconds to delay the request
  domain: null,         // Additional attributes to be adde to query parameter.
  
  /** Make the initial setup of the manager for this faceting skill (field, exclusion, etc.)
    */
  init: function (manager) {
    this.manager = manager;
  },
  
  /** Make the actual filtering obeying the "delayed" settings.
    */
  doRequest: function () {
    if (this.delayed == null)
      return this.manager.doRequest();
    else if (this.delayTimer != null)
      clearTimeout(this.delayTimer);
      
    var self = this;
    this.delayTimer = setTimeout(function () {
      self.manager.addParameter('start', 0);
      self.manager.doRequest();
      self.delayTimer = null;
    }, this.delayed);
  },
  
  /**
   * Sets the main Solr query to the given string.
   *
   * @param {String} q The new Solr query.
   * @returns {Boolean} Whether the selection changed.
   */
  set: function (q) {
    var before = this.manager.getParameter('q'),
        res = this.manager.addParameter('q', q, this.domain);
        after = this.manager.getParameter('q');
    return res && !a$.equal(before, after);
  },

  /**
   * Sets the main Solr query to the empty string.
   *
   * @returns {Boolean} Whether the selection changed.
   */
  clear: function () {
    return this.manager.removeParameters('q');
  },

  /**
   * Returns a function to unset the main Solr query.
   *
   * @returns {Function}
   */
  unclickHandler: function () {
    var self = this;
    return function () {
      if (self.clear())
        self.doRequest();

      return false;
    }
  },

  /**
   * Returns a function to set the main Solr query.
   *
   * @param {String} value The new Solr query.
   * @returns {Function}
   */
  clickHandler: function (q) {
    var self = this;
    return function () {
      if (self.set(q))
        self.doRequest();

      return false;
    }
  }
  
};
