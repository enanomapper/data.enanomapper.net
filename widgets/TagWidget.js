(function (Solr, a$, $, jT) {

jT.TagWidgeting = function (settings) {
  a$.extend(true, this, settings);
};

jT.TagWidgeting.prototype = {
  __expects: [ "hasValue", "clickHandler", "getFacetCounts" ],
  init: function (manager) {
    if (this.nestingField != null)
      this.facet.domain = a$.extend(this.facet.domain, { blockChildren: this.nestingField + ":substance"} );

    a$.pass(this, jT.TagWidgeting, "init", manager);  
  },
  
  afterTranslation: function (data) {
    a$.pass(this, jT.TagWidgeting, 'afterTranslation'); 

    var self = this,
        objectedItems = this.getFacetCounts(data.facets), 
    		facet = null, 
    		total = 0,
    		hdr = getHeaderText(this.header),
    		refresh = this.header.data("refreshPanel"),
    		el, selected;
        
    objectedItems.sort(function (a, b) {
      return a.val < b.val ? -1 : 1;
    });
    
    if (objectedItems.length == 0)
      this.target.html('no items found in current selection');
    else {
      this.target.empty();
      for (var i = 0, l = objectedItems.length; i < l; i++) {
        facet = objectedItems[i];
        selected = this.hasValue(facet.val);
        total += facet.count;
        
        facet.title = facet.val.toString();
        if (typeof this.modifyTag === 'function')
          facet = this.modifyTag(facet);

        if (!selected) {
          var clickFn = this.clickHandler(facet.val);
          facet.onMain = function (e) {
            self.manager.getListener("current").addTag(facet, self);
            clickFn(e);
          }
        }
        
        this.target.append(el = this.renderTag(facet));
        
        if (selected)
          el.addClass("selected");
      }
    }
      
    hdr.textContent = jT.ui.updateCounter(hdr.textContent, total);
    if (!!refresh)
    	refresh.call();
  }
};

jT.TagWidget = a$(Solr.Requesting, Solr.Faceting, jT.TagWidgeting);

})(Solr, asSys, jQuery, jToxKit);
