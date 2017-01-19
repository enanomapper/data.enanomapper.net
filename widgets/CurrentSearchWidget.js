(function (Solr, a$, $, jT) {

jT.CurrentSearchWidgeting = function (settings) {
  a$.extend(true, this, a$.common(settings, this));
  
  this.target = settings.target;
  this.id = settings.id;
  
  this.manager = null;
  this.skipClear = false;
  this.facetWidgets = {};
  this.fqName = this.useJson ? "json.filter" : "fq";
};

jT.CurrentSearchWidgeting.prototype = {
  useJson: false,
  renderItem: null,
  
  init: function (manager) {
    var self = this;
        self.slidersBlock = $("#sliders");
        
    self.manager = manager;
        
    self.applyCommand = $("#sliders-controls a.command.apply").on("click", function (e) {
      self.skipClear = true;
      self.manager.doRequest();
      return false;
    });
    
    $("#sliders-controls a.command.close").on("click", function (e) {
      self.rangeRemove();
      return false;
    });
  },
  
  registerWidget: function (widget, pivot) {
    this.facetWidgets[widget.id] = pivot;
  },
  
  afterTranslation: function (data) {
    var self = this,
        links = [],
        q = this.manager.getParameter('q'),
        fq = this.manager.getAllValues(this.fqName);
        
    if (self.skipClear) {
      self.skipClear = false;
      return;
    }
        
    // add the free text search as a tag
    if (!!q.value && !q.value.match(/^(\*:)?\*$/)) {
        links.push(self.renderItem({ title: q.value, count: "x", onMain: function () {
          q.value = "";
          self.manager.doRequest();
          return false;
        } }).addClass("tag_fixed"));
    }

    // now scan all the parameters for facets and ranges.
    for (var i = 0, l = fq != null ? fq.length : 0; i < l; i++) {
	    var f = fq[i],
	        vals = null;
	    
      for (var wid in self.facetWidgets) {
  	    var w = self.manager.getListener(wid),
  	        vals = w.fqParse(f);
  	        if (!!vals)
  	          break;
  	  }
  	  
  	  if (!Array.isArray(vals))
  	    vals = [ vals ];
  	        
      for (var j = 0, fvl = vals.length; j < fvl; ++j) {
        var v = vals[j], el, info;
        
        if (typeof w.prepareTag === "function")
          info = w.prepareTag(v);
        else
          info = {  title: v,  count: "-",  color: w.color, onMain: w.unclickHandler(v) };
          
    		links.push(el = self.renderItem(info).addClass("tag_selected " + (!!info.onAux ? "tag_open" : "tag_fixed")));

    		if (fvl > 1)
    		  el.addClass("tag_combined");
      }
      
      if (fvl > 1)
		    el.addClass("tag_last");
    }
    
    if (links.length) {
      links.push(self.renderItem({ title: "Clear", onMain: function () {
        q.value = "";
        for (var wid in self.facetWidgets)
    	    self.manager.getListener(wid).clearValues();
    	    
        self.manager.doRequest();
        return false;
      }}).addClass('tag_selected tag_clear tag_fixed'));
      
      this.target.empty().addClass('tags').append(links);
    }
    else
      this.target.removeClass('tags').html('<li>No filters selected!</li>');
  }

};

jT.CurrentSearchWidget = a$(jT.CurrentSearchWidgeting);

})(Solr, asSys, jQuery, jToxKit);
