/** SolrJsX library - a neXt Solr queries JavaScript library.
  * General query management - actual requests, listeners, etc.
  *
  * Author: Ivan Georgiev
  * Copyright © 2016, IDEAConsult Ltd. All rights reserved.
  */
  
Solr.Management = function (obj) {
  a$.extend(true, this, obj);
  
  this.listeners = {};  // The set of listeners - based on their 'id'.
  this.response = null;
  this.error = null;

  this.currentRequest = null;
  this.pendingRequest = null;
};

Solr.Management.prototype = {
  /** Parameters that can and are expected to be overriden during initialization
    */
  connector: null,      // The object for making the actual requests - jQuery object works pretty fine.
  solrUrl: "",          // The bas Solr Url to be used, excluding the servlet.
  servlet: "select",    // Default servlet to be used is "select".
  
  onError: function (message) { window.console && console.log && console.log(message); },
  onPrepare: function (ajaxSettings) { },
  onSuccess: null,
  ajaxSettings: {        // Default settings for the ajax call to the `connector`
    async: true,
    dataType: "json",
    method: 'GET',
    processData: false,
  },

  /** The method for performing the actual request.
    */
  doRequest: function (servlet) {
    var self = this,
        cancel = null,
        settings = {};
    
    // Suppress same request before this one is finished processing. We'll
    // remember that we're being asked and will make _one_ request afterwards.
    if (self.currentRequest != null && self.currentRequest == servlet) {
      self.pendingRequest = servlet || self.servlet;
      return;
    }
    self.inRequest = true;
    
    // Now go to inform the listeners that a request is going to happen and
    // give them a change to cancel it.
    a$.each(self.listeners, function (l) {
      if (a$.act(l, l.beforeRequest, self) === false)
        cancel = l;
    })

    if (cancel !== null) {
      a$.act(cancel, self.onError, "Request cancelled", cancel);
      return; 
    }
    
    // Now let the Querying skill build the settings.url / data
    settings = a$.extend(settings, self.ajaxSettings, self.prepareQuery());
    settings.url = self.solrUrl + (servlet || self.servlet) + (settings.url || "");

    // Prepare the handlers for both error and success.
    settings.error = self.onError;
    settings.success = function (data) {
      self.parseQuery(self.response = data);
      a$.each(self.listeners, function (l) { a$.act(l, l.afterRequest, self); });
      
      // Call this for Querying skills, if it is defined.
      a$.act(self, self.parseResponse, self.response);
      
      // Time to call the passed on success handler.
      a$.act(self, self.onSuccess);
      
      // Now deal with pending requests, if such exists.
      // Pay attention that this is _not_ recursion, because
      // We're in the success handler, i.e. - async.
      self.currentRequest = null;
      if (self.pendingRequest)
        self.doRequest(self.pendingRequest);
    };
    

    // Inform all our skills for the preparation.
    a$.broadcast(self, 'onPrepare', settings);

    // Give someone the opportunity to make some final tweaks.
    a$.act(self, self.onPrepare, settings);
    
    // And make the damn call.
    return self.connector.ajax( settings );
  },

  /** Initialize the management and most importantly - the listener's
    */
  init: function () {
    var self = this;
    a$.each(this.listeners, function (l) {
      // Inform the listener that it has been added.
      a$.act(l, l.init, self);
    })  
  },
  
  /** Add one or many listeners to the manager
    */   
  addListeners: function (one) {
    var listener = one;
    if (arguments.length > 1)
      listener = arguments;
    else if (!Array.isArray(one))
      listener = [ one ];
    else
      listener = one;
      
    for (var l, i = 0, ll = listener.length; i < ll; ++i) {
      l = listener[i];
      this.listeners[l.id] = l;
    }
    
    return this;
  },
  
  /** Remove one listener
    */
  removeListener: function (listener) {
    delete this.listeners[listener.id];
    return this;
  },
  
  /** Remove many listeners, according to the given selector.
    * The selector(listener, manager) is invoked and on `true`
    * the listener is removed.
    */
  removeManyListeners: function (selector) {
    var self = this;
    a$.each(self.listeners(function (l, id) {
      if (selector(l, self))
        delete self.listeners[id];
    }));
    
    return self;
  },
  
  /** Enumerate all listeners.
    */
  enumerateListeners: function(callback, context) {
    if (typeof callback !== 'function')
      return;
      
    a$.each(this.listeners, function (l, id) {
      callback.call(l, l, id, context);
    });
  },
  
  /** A listener retrieval method
    */
  getListener: function (id) {
    return this.listeners[id];
  }
};
