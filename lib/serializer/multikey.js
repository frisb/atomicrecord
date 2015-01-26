var AbstractSerializer, FDBoost, MultiKeySerializer, areEqual, fdb,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

AbstractSerializer = require('./abstract');

FDBoost = require('fdboost')();

fdb = FDBoost.fdb;

areEqual = function(recordVal, keyVal) {
  var i, _i, _ref;
  if (recordVal.length !== keyVal.length) {
    return false;
  }
  for (i = _i = 0, _ref = recordVal.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
    if (recordVal[i] !== keyVal[i]) {
      return false;
    }
  }
  return true;
};

module.exports = MultiKeySerializer = (function(_super) {
  __extends(MultiKeySerializer, _super);

  function MultiKeySerializer() {
    return MultiKeySerializer.__super__.constructor.apply(this, arguments);
  }

  MultiKeySerializer.prototype.encode = function(directory, record) {
    var destKey, encodedKey, encodedValue, i, keySuffix, keyValues, srcKey, val, _i, _ref;
    keyValues = [];
    for (i = _i = 0, _ref = record.aliasMap.destKeys.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
      srcKey = record.aliasMap.srcKeys[i];
      if (!this.keyFrag.fields[srcKey]) {
        val = record.__d[i];
        if (typeof val !== 'undefined') {
          destKey = record.aliasMap.destKeys[i];
          keySuffix = [destKey];
          encodedKey = this.keyFrag.encodeKey(directory, record, keySuffix);
          encodedValue = FDBoost.encoding.encode(val);
          keyValues.push([encodedKey, encodedValue]);
        }
      }
    }
    return keyValues;
  };

  MultiKeySerializer.prototype.decode = function(directory, keyValuePair) {
    var dest, field, i, primaryKey, record, _i, _len, _ref;
    primaryKey = this.keyFrag.decodeKey(directory, keyValuePair.key);
    dest = this.key[this.keyFrag.keyFields.length];
    if (this.cursor !== null) {
      record = this.cursor;
      _ref = this.keyFrag.keyFields;
      for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
        field = _ref[i];
        if (!areEqual(this.cursor.data(field), this.key[i])) {
          this.cursor.reset(true);
          this.state.push(record);
          record = new this.AtomicRecord(primaryKey);
          break;
        }
      }
    } else {
      record = new this.AtomicRecord(primaryKey);
    }
    record.data(dest, keyValuePair.value);
    return record;
  };

  return MultiKeySerializer;

})(AbstractSerializer);
