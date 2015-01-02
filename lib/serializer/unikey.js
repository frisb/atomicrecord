(function() {
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
      record.keySize = encodedKey.length;
      record.valueSize = encodedValue.length;
      return [[encodedKey, encodedValue]];
    };

    UniKeySerializer.prototype.decode = function(directory, keyValuePair) {
      var field, i, primaryKey, record, values, _i, _len;
      primaryKey = this.keyFrag.decodeKey(directory, keyValuePair.key);
      record = new this.ActiveRecord(primaryKey);
      values = fdb.tuple.unpack(keyValuePair.value);
      for (i = _i = 0, _len = values.length; _i < _len; i = ++_i) {
        field = values[i];
        record.data(field, values[i + 1]);
      }
      record.reset(true);
      this.state.push(record);
      return record;
    };

    return UniKeySerializer;

  })(AbstractSerializer);

}).call(this);

(function() {
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
      var encodedKey, encodedValue, i, keySuffix, srcKey, val, valArr, _i, _ref;
      keySuffix = [];
      valArr = [];
      for (i = _i = 0, _ref = record.aliasMap.destKeys.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        srcKey = record.aliasMap.srcKeys[i];
        if (!this.keyFrag.fields[srcKey]) {
          val = record.__d[i];
          if (typeof val !== 'undefined') {
            keySuffix.push(record.aliasMap.destKeys[i]);
            valArr.push(FDBoost.encoding.encode(val));
          }
        }
      }
      encodedKey = this.keyFrag.encodeKey(directory, record, keySuffix);
      encodedValue = fdb.tuple.pack(valArr);
      record.keySize = encodedKey.length;
      record.valueSize = encodedValue.length;
      return [[encodedKey, encodedValue]];
    };

    UniKeySerializer.prototype.decode = function(directory, keyValuePair) {
      var dest, i, pkLength, primaryKey, record, values, _i, _ref;
      primaryKey = this.keyFrag.decodeKey(directory, keyValuePair.key);
      record = new this.ActiveRecord(primaryKey);
      values = fdb.tuple.unpack(keyValuePair.value);
      pkLength = this.keyFrag.keyFields.length;
      for (i = _i = pkLength, _ref = this.key.length; pkLength <= _ref ? _i < _ref : _i > _ref; i = pkLength <= _ref ? ++_i : --_i) {
        dest = this.key[i];
        record.data(dest, values[i - pkLength]);
      }
      record.reset(true);
      this.state.push(record);
      return record;
    };

    return UniKeySerializer;

  })(AbstractSerializer);

}).call(this);
