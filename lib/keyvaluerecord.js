(function() {
  var FDBoost, ObjectID, RecordBase,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  ObjectID = require('bson').ObjectID;

  FDBoost = require('fdboost')();

  RecordBase = require('./recordbase');

  module.exports = function(options) {
    var Record, db, fdb, fields, partition, uniqueIdFactory, uniqueIdName;
    fdb = FDBoost.fdb;
    db = FDBoost.db;
    uniqueIdName = options.uniqueIdName, uniqueIdFactory = options.uniqueIdFactory, fields = options.fields, partition = options.partition;
    if (uniqueIdName == null) {
      uniqueIdName = 'id';
    }
    if (uniqueIdFactory == null) {
      uniqueIdFactory = function() {
        return new ObjectID().toHexString();
      };
    }
    return Record = (function(_super) {
      __extends(Record, _super);

      Record.prototype.keySize = 0;

      Record.prototype.valueSize = 0;

      Record.prototype.partition = partition;


      /**
       * Creates a new Record instance
       * @class
       * @param {object} record Record object initializer.
       * @return {Record} a Record instance.
       */

      function Record(record) {
        var src, val;
        Record.__super__.constructor.call(this);
        if (record) {
          for (src in record) {
            val = record[src];
            this.setValue(src, val);
          }
        }
        if (!(record || record[uniqueIdName])) {
          this[uniqueIdName] = uniqueIdFactory();
        }
      }

      Record.prototype.data = function(dest, val) {
        if (dest && typeof val === 'undefined') {
          val = Record.__super__.data.call(this, dest);
          if (val instanceof Buffer) {
            val = FDBoost.encoding.decode(val);
            this.data(dest, val);
          }
          return val;
        }
        return Record.__super__.data.call(this, dest, val);
      };

      Record.prototype.toKeyValues = function(subspace) {
        var d, encodedKey, encodedValue, i, key, keyValues, v, value, _i, _j, _len, _ref, _ref1;
        if (!this.partition) {
          key = [this[uniqueIdName]];
          value = [];
          for (i = _i = 0, _ref = this.schema.destKeys.length - 1; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
            v = this.__d[i + 1];
            if (typeof v !== 'undefined') {
              key.push(this.schema.destKeys[i + 1]);
              value.push(FDBoost.encoding.encode(v));
            }
          }
          encodedKey = this.provider.dir.records.pack(key);
          encodedValue = fdb.tuple.pack(value);
          this.keySize = encodedKey.length;
          this.valueSize = encodedValue.length;
          if (this.partition == null) {
            this.partition = this.keySize > 100 || this.valueSize > 1024;
          }
          return [[encodedKey, encodedValue]];
        } else {
          keyValues = [];
          _ref1 = this.schema.destKeys;
          for (_j = 0, _len = _ref1.length; _j < _len; _j++) {
            d = _ref1[_j];
            if (d !== uniqueIdName) {
              v = this.data(d);
              if (typeof v !== 'undefined') {
                keyValues.push([this.provider.dir.records.pack([this[uniqueIdName], d]), FDBoost.encoding.encode(v)]);
              }
            }
          }
          return keyValues;
        }
      };

      Object.defineProperties(Record.prototype, {
        keyValueSize: {
          get: function() {
            return this.keySize + this.valueSize;
          }
        }
      });

      return Record;

    })(RecordBase(uniqueIdName, fields));
  };

}).call(this);
