(function() {
  var Pseudonym,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Pseudonym = require('pseudonym');


  /**
   * Create an AbstractRecord class 
   * @method
   * @param {string} uniqueIdName First key in the query range.
   * @param {(string[]|object)} options.valueFields Last key in the query range.
   * @return {AbstractRecord} an AbstractRecord class
   */

  module.exports = function(uniqueIdName, valueFields) {
    var AbstractRecord, aliases, dest, src;
    if (valueFields instanceof Array) {
      aliases = [uniqueIdName].concat(valueFields);
    } else {
      aliases = Object.create(null);
      aliases[uniqueIdName] = uniqueIdName;
      for (src in valueFields) {
        dest = valueFields[src];
        aliases[src] = dest;
      }
    }
    return AbstractRecord = (function(_super) {
      __extends(AbstractRecord, _super);

      AbstractRecord.prototype.changed = [];

      AbstractRecord.prototype.isLoaded = false;

      AbstractRecord.prototype.isNew = true;

      function AbstractRecord() {
        AbstractRecord.__super__.constructor.call(this);
      }

      AbstractRecord.prototype.reset = function(isLoaded) {
        this.isLoaded = isLoaded;
        this.isNew = !isLoaded;
        this.changed = [];
      };

      AbstractRecord.prototype.setValue = function(key, val) {
        var field, _i, _len, _ref;
        dest = AbstractRecord.__super__.setValue.call(this, key, val);
        _ref = this.changed;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          field = _ref[_i];
          if (field === key) {
            return;
          }
        }
        this.changed.push(key);
        this.isNew = false;
      };

      Object.defineProperty(AbstractRecord.prototype, 'isChanged', {
        get: function() {
          return this.changed.length > 0;
        }
      });

      return AbstractRecord;

    })(Pseudonym(aliases));
  };

}).call(this);
