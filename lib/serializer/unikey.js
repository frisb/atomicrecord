var AbstractSerializer, FDBoost, UniKeySerializer, fdb,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

AbstractSerializer = require('./abstract');

FDBoost = require('fdboost')();

fdb = FDBoost.fdb;

module.exports = UniKeySerializer = (function(_super) {
  __extends(UniKeySerializer, _super);

  function UniKeySerializer() {
    return UniKeySerializer.__super__.constructor.apply(this, arguments);
  }

  UniKeySerializer.prototype.encode = function(directory, record) {
    var destKey, encodedKey, encodedValue, i, srcKey, val, valArr, _i, _len, _ref;
    valArr = [];
    _ref = record.aliasMap.destKeys;
    for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
      destKey = _ref[i];
      srcKey = record.aliasMap.srcKeys[i];
      if (!this.keyFrag.fields[srcKey]) {
        val = record.__d[i];
        if (typeof val !== 'undefined') {
          valArr.push(destKey, FDBoost.encoding.encode(val));
        }
      }
    }
    encodedKey = this.keyFrag.encodeKey(directory, record);
    encodedValue = fdb.tuple.pack(valArr);
    record.key = encodedKey;
    record.keySize = encodedKey.length;
    record.valueSize = encodedValue.length;
    return [[encodedKey, encodedValue]];
  };

  UniKeySerializer.prototype.decode = function(directory, keyValuePair) {
    var field, i, record, valueItems, _i, _len;
    record = new this.AtomicRecord();
    record.key = keyValuePair.key;
    record.keySize = keyValuePair.key.length;
    record.valueSize = keyValuePair.value.length;
    this.keyFrag.decodeDirectory(directory, record);
    this.keyFrag.decodeKey(directory, keyValuePair.key, record);
    valueItems = fdb.tuple.unpack(keyValuePair.value);
    for (i = _i = 0, _len = valueItems.length; _i < _len; i = ++_i) {
      field = valueItems[i];
      record.data(field, valueItems[i + 1]);
    }
    record.reset(true);
    this.state.push(record);
    return record;
  };

  return UniKeySerializer;

})(AbstractSerializer);
