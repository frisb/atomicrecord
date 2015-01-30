var Pseudonym,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Pseudonym = require('pseudonym');


/**
 * Create an AbstractRecord class 
 * @method
 * @param {string} idName Record instance unique identifier name.
 * @param {string[]|object} fields AliasMap initializer.
 * @return {AbstractRecord} an AbstractRecord class
 */

module.exports = function(fields) {
  var AbstractRecord, aliases, dest, src;
  if (fields instanceof Array) {
    aliases = fields;
  } else {
    aliases = Object.create(null);
    for (src in fields) {
      dest = fields[src];
      aliases[src] = dest;
    }
  }
  return AbstractRecord = (function(_super) {
    __extends(AbstractRecord, _super);

    AbstractRecord.prototype.changed = [];

    AbstractRecord.prototype.isLoaded = false;

    AbstractRecord.prototype.isNew = true;


    /**
     * Creates a new AbstractRecord instance 
     * @class
     * @return {AbstractRecord} an AbstractRecord instance
     */

    function AbstractRecord() {
      AbstractRecord.__super__.constructor.call(this);
    }


    /**
     * Resets the record instance state
     * @param {Boolean} isLoaded Flag if instance has had data loaded from store.
     * @return {undefined}
     */

    AbstractRecord.prototype.reset = function(isLoaded) {
      this.isLoaded = isLoaded;
      this.isNew = !isLoaded;
      this.changed = [];
    };


    /**
     * Overrides the Pseudonym prototype setValue method
     * @virtual
     * @param {string} src Source property name.
     * @param {object} val Value to set.
     * @return {string} Property alias.
     */

    AbstractRecord.prototype.setValue = function(src, val) {
      var field;
      dest = AbstractRecord.__super__.setValue.call(this, src, val);
      if ((function() {
        var _i, _len, _ref, _results;
        _ref = this.changed;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          field = _ref[_i];
          _results.push(field === src);
        }
        return _results;
      }).call(this)) {
        return;
      }
      this.changed.push(src);
      this.isNew = false;
      return dest;
    };

    Object.defineProperty(AbstractRecord.prototype, 'isChanged', {
      get: function() {
        return this.changed.length > 0;
      }
    });

    return AbstractRecord;

  })(Pseudonym(aliases));
};
