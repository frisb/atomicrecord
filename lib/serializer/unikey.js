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
      var encodedKey, encodedValue, i, index, keyArr, srcKey, val, valArr, _i, _ref;
      keyArr = this.ActiveRecordPrototype.keyResolver.resolve(record);
      valArr = [];
      for (i = _i = 0, _ref = record.aliasMap.destKeys.length - 1; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        index = i + 1;
        srcKey = record.aliasMap.srcKeys[index];
        if (!this.ActiveRecordPrototype.fieldExclusions[srcKey]) {
          val = record.__d[index];
          if (typeof val !== 'undefined') {
            keyArr.push(record.aliasMap.destKeys[index]);
            valArr.push(FDBoost.encoding.encode(val));
          }
        }
      }
      encodedKey = directory.pack(keyArr);
      encodedValue = fdb.tuple.pack(valArr);
      record.keySize = encodedKey.length;
      record.valueSize = encodedValue.length;
      return [[encodedKey, encodedValue]];
    };

    UniKeySerializer.prototype.decode = function(foundationDBValue) {
      var dest, i, id, map, record, values, _i, _ref;
      record = null;
      id = this.key[0];
      record = new this.ActiveRecordPrototype();
      record.id = this.key[1].toString('hex');
      record.timestamp = this.key[0];
      map = new Array(this.key.length - 1);
      values = fdb.tuple.unpack(foundationDBValue);
      for (i = _i = 1, _ref = this.key.length; 1 <= _ref ? _i < _ref : _i > _ref; i = 1 <= _ref ? ++_i : --_i) {
        dest = this.key[i];
        record.data(dest, values[i - 1]);
      }
      record.reset(true);
      console.log('decoded', record.toDocument(true));
      return record;
    };

    return UniKeySerializer;

  })(AbstractSerializer);

}).call(this);
