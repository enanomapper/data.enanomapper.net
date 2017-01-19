(function (Solr, a$, $, jT) {
  
  function SimpleRanger(settings) {
    this.root = settings.root;  
  }
  
  SimpleRanger.prototype.updateHandler = function () {
    var self = this;
    return function (values) {
      if (!!self.addValue(values))
        self.doRequest();
    };
  }
  
  SingleRangeWidget = a$(Solr.Ranging, jT.SliderWidget, SimpleRanger);
  
	/** The general wrapper of all parts
  	*/
  jT.kits.RangeWidgeting = function (settings) {
    a$.extend(true, this, a$.common(settings, this));

    this.slidersTarget = $(settings.slidersTarget);
    this.pivotMap = null;
    this.rangeWidgets = [];
  };
  
  jT.kits.RangeWidgeting.prototype = {
    __expects: [ "getPivotEntry", "getPivotCounts" ],
    
    init: function (manager) {
      a$.pass(this, jT.kits.RangeWidgeting, "init", manager);
      this.manager = manager;
      
      var self = this;
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
    
    afterTranslation: function (data) {
      var pivot = this.getPivotCounts(data.facets);
            
      a$.pass(this, jT.kits.RangeWidgeting, "afterTranslation", data);
            
      if (!this.pivotMap)
        this.pivotMap =  this.buildPivotMap(pivot);
      
      if (this.skipClear)
        this.rangeRemove();
    },
    
    buildPivotMap: function (pivot) {
      var self = this,
          map = {};
          traverser = function (base, idx, pattern, valId) {
            var p = self.getPivotEntry(idx),
                pid = p.id,
                color = p.color,
                info;
            
            // Make the Id first
            if (p.ranging && !p.disabled)
              valId = pid + ":" + base.val;
              
            // Now deal with the pattern
            if (pattern.length > 0)
              pattern += " AND ";
            pattern += p.field + ":" + Solr.escapeValue(base.val);
            info = base;
              
            p = self.getPivotEntry(idx + 1);
            if (p != null)
              base = base[p.id].buckets;

            // If we're at the bottom - add some entries...
            if (p == null || !base.length) {
              var arr = map[valId];
              if (arr === undefined)
                map[valId] = arr = [];
              
              arr.push({
                'id': pid,
                'pattern': "-(" + pattern + " -{{v}})",
                'color': color,
                'min': info.min,
                'max': info.max,
                'avg': info.avg,
                'val': info.val
              });
            }
            // ... or just traverse and go deeper.
            else {
              for (var i = 0, bl = base.length; i < bl; ++i)
                traverser(base[i], idx + 1, pattern, valId);
            }
          };
          
      for (var i = 0;i < pivot.length; ++i)
        traverser(pivot[i], 0, "");
        
      return map;
    },
    
    rangeRemove: function() {
      this.slidersTarget.empty();
      this.slidersTarget.parent('div').removeClass("active");
      this.rangeWidgets = [];
    },
    
    auxHandler: function (value) {
      var self = this;
      
      return function (event) {
        var entry = self.pivotMap[value],
            pivotMap = self.buildPivotMap(self.getPivotCounts()),
            current = pivotMap[value];

        event.stopPropagation();

        // deal with clicking the button on somebody else
        if ($(this).closest("li").hasClass("active")) {
          self.rangeRemove();
          return false;
        }
        
        self.slidersTarget.parent('div').find("li").removeClass("active");
        $(this).closest("li").addClass("active");
        self.slidersTarget.empty().parent().addClass("active");

        for (var i = 0, el = entry.length; i < el; ++i) {
          var all = entry[i],
              ref = current[i],
              setup = {},
              el$ = jT.ui.fillTemplate("#slider-one");

          self.slidersTarget.append(el$);
          
          setup.limits = [ all.min, all.max ];
          setup.initial = [ ref.min, ref.max ];
          setup.target = el$;
          setup.isRange = true;
          setup.valuePattern = all.pattern;
          setup.automatic = true;
          setup.width = parseInt(self.slidersTarget.width() - $("#sliders-controls").width() - 20) / (Math.min(el, 2) + 0.1);
          setup.title = ""; // TODO: Big TODO here!
          setup.id = all.id;
          setup.color = all.color;
          setup.units = ref.id == "unit" ? jT.ui.formatUnits(ref.val) : "";
            
          self.rangeWidgets.push(new SingleRangeWidget(setup));
        }
        
        return false;
      };
    }
	};
	
})(Solr, asSys, jQuery, jToxKit);
