$(document).ready(function(){

	$("#smartmenu").smartmenus();
  $("#about-message").dialog({
    modal: true,
    buttons: {
      Ok: function() {
        $( this ).dialog( "close" );
      }
    }
  });
  $("#about-message").dialog("close");
  
  Settings.onPreInit = function (manager) {
  	// ... auto-completed text-search.
  	var textWidget = new (a$(Solr.Requesting, Solr.Spying, Solr.Texting, jT.AutocompleteWidget))({
  		id : 'text',
  		target : $('#freetext'),
  		domain: { type: "parent", which: "type_s:substance" },
  		useJson: true,
  		lookupMap: lookup,
  		urlFeed: "search",
  		escapeNeedle: true
  	});
  	
  	manager.addListeners(textWidget);
    manager.addListeners(jT.ui.Logging.prototype.__kits[0]);

  	// Set some general search machanisms
  	$(document).on('click', "a.freetext_selector", function (e) {
  		if (textWidget.addValue(this.innerText))
  		  manager.doRequest();
  	});
		
		jT.ui.attachKit(textWidget.target, textWidget);
	};
  
  jT.ui.initialize();
});
