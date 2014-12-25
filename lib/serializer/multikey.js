(function() {
  var AbstractSerializer, FDBoost, MultiKeySerializer, fdb,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  AbstractSerializer = require('./abstract');

  FDBoost = require('fdboost')();

  fdb = FDBoost.fdb;

  module.exports = MultiKeySerializer = (function(_super) {
    __extends(MultiKeySerializer, _super);

    function MultiKeySerializer() {
      return MultiKeySerializer.__super__.constructor.apply(this, arguments);
    }

    MultiKeySerializer.prototype.encode = function(directory, record) {
      var destKey, encodedKey, encodedValue, i, index, keyArr, keyValues, srcKey, val, _i, _ref;
      keyValues = [];
      for (i = _i = 0, _ref = this.aliasMap.destKeys.length - 1; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        index = i + 1;
        srcKey = this.aliasMap.srcKeys[index];
        if (!fieldExclusions[srcKey]) {
          val = this.__d[index];
          if (typeof val !== 'undefined') {
            destKey = this.aliasMap.destKeys[index];
            keyArr = this.ActiveRecordPrototype.keyResolver.resolve(this, [destKey]);
            encodedKey = directory.pack(keyArr);
            encodedValue = FDBoost.encoding.encode(val);
            keyValues.push([encodedKey, encodedValue]);
          }
        }
      }
      return keyValues;
    };

    MultiKeySerializer.prototype.decode = function(foundationDBValue) {
      var dest, id, record;
      record = null;
      id = this.key[0];
      dest = this.key[1];
      if (this.currentRecord !== null) {
        record = this.currentRecord;
        if (this.currentRecord.id !== id) {
          this.currentRecord.reset(true);
          this.assembled.push(record);
          record = new this.ActiveRecordPrototype(id);
        }
      } else {
        record = new this.ActiveRecordPrototype(id);
      }
      if (dest) {
        record.data(dest, value);
      }
      return record;
    };

    return MultiKeySerializer;

  })(AbstractSerializer);

}).call(this);
