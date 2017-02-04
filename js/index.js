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
  
  jT.ui.initialize();
  
  var needle = $.url().param('search');
  if (!!needle) {
    var widget = jT.ui.kit("freetext");
    if (widget.addValue(needle))
      widget.doRequest();
  }

});
