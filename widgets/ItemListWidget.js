(function(jT, a$, $) {
	jT.ItemListWidget = function (settings) {
  	this.renderItem = settings && settings.renderItem || this.renderItem;
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
		var external = null,
			sniphtml = $("#study-item").html(),
			snippets = doc._extended_.study.map(this.renderStudy),
			item = { 
				logo: "images/logo.png",
				link: "#",
				title: (doc.publicname || doc.name) + (doc.pubname === doc.name ? "" : "  (" + doc.name[0] + ")") 
				      + (doc.substanceType == null ? "" : (" " 
				        + (lookup[doc.substanceType] || doc.substanceType)
// 				        + " " + (prop == null ? "" : "[" + prop + "] ")
				      )),
				composition: this.renderComposition(doc._extended_.composition),
				snippet: "",
				item_id: (this.prefix || this.id || "item") + "_" + doc.s_uuid,
				footer: 
					'<a href="' + this.settings.root + doc.s_uuid + '" title="Substance" target="' + doc.s_uuid + '">Material</a>' +
					'<a href="' + this.settings.root + doc.s_uuid + '/structure" title="Composition" target="' + doc.s_uuid + '">Composition</a>' +
					'<a href="' + this.settings.root + doc.s_uuid + '/study" title="Study" target="' + doc.s_uuid + '">Study</a>'
			};

		item.snippet = ccLib.formatString(sniphtml, snippets[0]);
		if (snippets.length > 1) {
			snippets.splice(0, 1);
			item.snippet += 
				'<a href="#" class="more">more</a>' +
				'<div class="more-less" style="display:none;">' + snippets.map(function (s) { return ccLib.formatString(sniphtml, s)}).join("") + '</div>';
		}
		
		if (doc.content == null) {
			item.link = this.settings.root + doc.s_uuid;
			item.href = item.link	+ "/study";
			item.href_title = "Study";
			item.href_target = doc.s_uuid;
		} 
		else {
			item.href = item.link || "#";
			
			if (!!doc.owner_name && doc.owner_name.lastIndexOf("caNano", 0) === 0) {
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
					item.footer += '<a href="' + doc.content[i] + '" target="external">' + (external || "External database") + '</a>';	
			}
		}	
		
		return jT.getFillTemplate("#result-item", item);
	};
	
	jT.ItemListWidget.prototype.renderComposition = function (composition) {
  	return composition != null ? composition.map(function (c) { return c.component; }).join("<br/>") : "";
	};
	
	jT.ItemListWidget.prototype.renderStudy = function(doc) {
		var value = "",
				snippet = {
					'category': doc.topcategory_s + "." + (lookup[doc.endpointcategory_s] || doc.endpointcategory_s),
					'interpretation': doc.interpretation_result_s || "",
					'guidance': !!doc.guidance_s ? "[" + doc.guidance_s + "]" : "",
					'link': "",
					'href': "",
					'title': ""
				};
				
		if (!!doc.effectendpoint_s)	value += lookup[doc.effectendpoint_s] || doc.effectendpoint_s + " = ";
		if (!!doc.loValue_d) value += " " + doc.loValue_d;
// 		if (!!doc.upValue_d) value += (!doc.loValue_d ? " " : "&hellip") + (doc.upValue_d || "");
		if (!!doc.unit_s) value += '<span class="units">' + jT.ui.formatUnits(doc.unit_s) + '</span>';
		if (!!doc.textValue_s) value += " " + doc.textValue_s;

		snippet.value = value;
		if (doc.reference_s != null) {
			snippet.link = (doc.reference_year_s == null) ? "DOI" : "[" + doc.reference_year_s + "]";
			snippet.href = snippet.title = doc.reference_s;
		}

		return snippet;
	};
})(jToxKit, asSys, jQuery);
