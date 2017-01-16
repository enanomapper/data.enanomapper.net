(function(jT, a$, $) {
  var htmlLink = '<a href="{{href}}" title="{{hint}}" target="{{target}}">{{value}}</a>',
      defaultSettings = {
        summaryPrime: "RESULTS",
        summaryRenderers: {
          "RESULTS": function (val, topic) { 
            return val.map(function (study) { return study.split(".").map(function (one) { return lookup[one] || one; }).join("."); });
          },
          "REFOWNERS": function (val, topic) {
            return val.map(function (ref) { return jT.ui.formatString(htmlLink, { href: "#", hint: "Freetext search", target: "_self", value: ref }); });
          },
          "REFS": function (val, topic) { 
            return val.map(function (ref) { return jT.ui.formatString(htmlLink, { href: ref, hint: "External reference", target: "ref", value: ref }); });
          }
        }
      };
  
	jT.ItemListWidget = function (settings) {
  	this.settings = defaultSettings;
  	if (!!settings) {
    	this.renderItem = settings.renderItem || this.renderItem;
    	this.settings = a$.extend(true, this.settings, settings.settings);
  	}
	};

	jT.ItemListWidget.prototype.renderItem = function (doc) {
		var self = this,
				el = $(this.renderSubstance(doc));
				
		if (!el.length) 
		  return null;

		$(this.target).append(el);
		
		if (typeof this.onClick === "function")
			$("a.command", el[0]).on("click", function (e) { self.onClick.call(el[0], e, doc, self); });
			
		if (typeof this.onCreated === 'function')
			this.onCreated.call(el, doc, this);
				
		$("a.more", el[0]).on("click", function(e) {
			e.preventDefault();
			e.stopPropagation();
			var $this = $(this), 
					$div = $(".more-less", $this.parent()[0]);

			if ($div.is(':visible')) {
				$div.hide();
				$this.text('more');
			} else {
				$div.show();
				$this.text('less');
			}

			return false;
		});
		
		return null;
	};
	
	/**
	 * substance
	 */
	jT.ItemListWidget.prototype.renderSubstance = function(doc) {
		var summaryhtml = $("#summary-item").html(),
		    summarylist = this.buildSummary(doc),
		    item = { 
  				logo: "images/logo.png",
  				link: "#",
  				href: "#",
  				title: (doc.publicname || doc.name) + (doc.pubname === doc.name ? "" : "  (" + doc.name + ")") 
  				      + (doc.substanceType == null ? "" : (" " 
  				        + (lookup[doc.substanceType] || doc.substanceType)
  				      )),
  				composition: this.renderComposition(doc, 
    				  '<a href="' + this.settings.root + doc.s_uuid + '/structure" title="Composition" target="' + doc.s_uuid + '">&hellip;</a>'
    				).join("<br/>"),
    		  summary: summarylist.length > 0 ? jT.ui.formatString(summaryhtml, summarylist[0]) : "",
  				item_id: (this.prefix || this.id || "item") + "_" + doc.s_uuid,
  				footer: 
  					'<a href="' + this.settings.root + doc.s_uuid + '" title="Substance" target="' + doc.s_uuid + '">Material</a>' +
  					'<a href="' + this.settings.root + doc.s_uuid + '/structure" title="Composition" target="' + doc.s_uuid + '">Composition</a>' +
  					'<a href="' + this.settings.root + doc.s_uuid + '/study" title="Study" target="' + doc.s_uuid + '">Studies</a>'
  			};

    // Build the outlook of the summary item
    if (summarylist.length > 1) {
			summarylist.splice(0, 1);
			item.summary += 
				'<a href="#" class="more">more</a>' +
				'<div class="more-less" style="display:none;">' + summarylist.map(function (s) { return jT.ui.formatString(summaryhtml, s)}).join("") + '</div>';
    }
    
    // Check if external references are provided and prepare and show them.
		if (doc.content == null) {
			item.link = this.settings.root + doc.s_uuid;
			item.href = item.link	+ "/study";
			item.href_title = "Study";
			item.href_target = doc.s_uuid;
		} 
		else {
  		var external = "External database";
  		
			if (doc.owner_name && doc.owner_name.lastIndexOf("caNano", 0) === 0) {
				item.logo = "images/canano.jpg";
				item.href_title = "caNanoLab: " + item.link;
				item.href_target = external = "caNanoLab";
				item.footer = '';
			}
			else {
				item.logo = "images/external.png";
				item.href_title = "External: " + item.link;
				item.href_target = "external";
			}
			
			if (doc.content.length > 0) {
				item.link = doc.content[0];	

				for (var i = 0, l = doc.content.length; i < l; i++)
					item.footer += '<a href="' + doc.content[i] + '" target="external">' + external + '</a>';
			}
		}	
		
		return jT.ui.fillTemplate("#result-item", item);
	};
	
	jT.ItemListWidget.prototype.renderComposition = function (doc, defValue) {
  	var summary = [];
  	    composition = doc._extended_ && doc._extended_.composition;
  	    
    if (!!composition) {
      var cmap = {};
      a$.each(composition, function(c) {
        var ce = cmap[c.component],
            se = [];
        if (ce === undefined)
          cmap[c.component] = ce = [];
        
        a$.each(c, function (v, k) {
          k = k.match(/([^_]+)_?\a?/)[1];
          if (k != "type" && k != "id" && k != "component")
            se.push(k + ":" + jT.ui.formatString(htmlLink, { href: "#", hint: "Freetext search", target: "_self", value: v }));
        });
        
        ce.push(se.join(", "));
    	});
    	
    	a$.each(cmap, function (map, type) {
        var entry = "";
        for (var i = 0;i < map.length; ++i) {
          if (map[i] == "")
            continue;
            
        	entry += (i == 0) ? ": " : "; ";
        	if (map.length > 1)
        	  entry += "<strong>[" + (i + 1) + "]</strong>&nbsp;";
          entry += map[i];
      	}
      	
      	if (entry === "")
      	  entry = ":&nbsp;" + defValue;
      	  
        entry = type + " (" + map.length + ")" + entry;
      	  
      	summary.push(entry);
    	});
    }
  	
  	return summary;
	};
	
	jT.ItemListWidget.prototype.buildSummary = function(doc) {
  	var self = this,
  	    items = [];
  	
  	a$.each(doc, function (val, key) {
    	var name = key.match(/^SUMMARY\.([^_]+)_?[hsd]*$/);
    	if (!name)
    	  return;
    	  
      name = name[1];
      var render = (self.settings.summaryRenderers[name] || self.settings.summaryRenderers._),
          item = typeof render === "function" ? render(val, name) : val;

      if (!item)
        return;
      
      if (typeof item !== "object" || Array.isArray(item))
        item = { 'topic': name.toLowerCase(), 'values' : item };
      else if (item.topic == null)
        item.topic = name.toLowerCase();
      
      if (!item.content)
        item.content = Array.isArray(item.values) ? item.values.join(", ") : item.values.toString();
        
      if (name == self.settings.summaryPrime)
        items.unshift(item);
      else
        items.push(item);
  	});
  	
  	return items;
	};
})(jToxKit, asSys, jQuery);
