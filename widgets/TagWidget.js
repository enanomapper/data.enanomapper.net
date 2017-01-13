(function (Solr, a$, $, jT) {

jT.TagWidgeting = function (settings) {
  a$.extend(this, settings);
};

jT.TagWidgeting.prototype = {
  __expects: [ "hasValue", "clickHandler", "getFacetCounts", ],
  init: function (manager) {
    if (this.nestingField != null)
      this.facet.domain = a$.extend(this.facet.domain, { blockChildren: this.nestingField + ":substance"} );

    a$.pass(this, jT.TagWidgeting, "init", manager);  
  },
  
  afterTranslation: function (data) {
    a$.pass(this, jT.TagWidgeting, 'afterTranslation'); 

    var objectedItems = this.getFacetCounts(data.facets), 
    		facet = null, 
    		total = 0,
    		hdr = getHeaderText(this.header),
    		refresh = this.header.data("refreshPanel"),
    		nullf = function (e) { return false; },
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
        
        this.target.append(el = this.renderTag(facet.val.toString(), facet.count, selected ? nullf : this.clickHandler(facet.val)));
        
        if (selected)
          el.addClass("selected");
      }
    }
      
    hdr.textContent = jT.ui.updateCounter(hdr.textContent, total);
    if (!!refresh)
    	refresh.call();
  }
};

jT.TagWidget = a$(jT.TagWidgeting, Solr.Faceting, Solr.Requesting);

})(Solr, asSys, jQuery, jToxKit);
