(function() {
  var AbstractRecord, DirectoryResolver, FDBoost, KeyResolver, ObjectID,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  ObjectID = require('bson').ObjectID;

  AbstractRecord = require('./abstract');

  FDBoost = require('fdboost')();

  DirectoryResolver = require('../resolvers/directory');

  KeyResolver = require('../resolvers/key');

  module.exports = function(options) {
    var KeyValueRecord, SerializerFactory, db, directoryResolver, fdb, field, fieldExclusions, keyFields, keyResolver, partition, uniqueIdName, valueFields, _i, _j, _len, _len1, _ref, _ref1;
    fdb = FDBoost.fdb;
    db = FDBoost.db;
    uniqueIdName = options.uniqueIdName, partition = options.partition, keyFields = options.keyFields, valueFields = options.valueFields;
    if (uniqueIdName == null) {
      uniqueIdName = 'id';
    }
    directoryResolver = new DirectoryResolver(options);
    keyResolver = new KeyResolver(uniqueIdName, keyFields);
    fieldExclusions = {};
    _ref = directoryResolver.fields;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      field = _ref[_i];
      fieldExclusions[field] = 1;
    }
    _ref1 = keyResolver.fields;
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      field = _ref1[_j];
      fieldExclusions[field] = 1;
    }
    SerializerFactory = require('./serializer/factory')(uniqueIdName, uniqueIdFactory, keyFields, fieldExclusions);
    return KeyValueRecord = (function(_super) {
      __extends(KeyValueRecord, _super);

      function KeyValueRecord() {
        return KeyValueRecord.__super__.constructor.apply(this, arguments);
      }

      KeyValueRecord.directoryResolver = directoryResolver;

      KeyValueRecord.deserialize = function(ActiveRecordPrototype, directory, keyValuePairs, callback) {
        var serializer;
        serializer = SerializerFactory.get(partition);
        return serializer.deserialize(ActiveRecordPrototype, directory, keyValuePairs, callback);
      };

      KeyValueRecord.prototype.keySize = 0;

      KeyValueRecord.prototype.valueSize = 0;

      KeyValueRecord.prototype.partition = partition;

      KeyValueRecord.prototype.data = function(dest, val) {
        if (dest && typeof val === 'undefined') {
          val = KeyValueRecord.__super__.data.call(this, dest);
          if (dest !== uniqueIdName && val instanceof Buffer) {
            val = FDBoost.encoding.decode(val);
            this.data(dest, val);
          }
          return val;
        }
        return KeyValueRecord.__super__.data.call(this, dest, val);
      };

      KeyValueRecord.prototype.serialize = function(callback) {
        var serializer;
        serializer = SerializerFactory.get(partition);
        return serializer.serialize(this, callback);
      };

      KeyValueRecord.prototype.resolveDirectory = function(callback) {
        return directoryResolver.resolve(this, callback);
      };

      Object.defineProperties(KeyValueRecord.prototype, {
        keyValueSize: {
          get: function() {
            return this.keySize + this.valueSize;
          }
        }
      });

      return KeyValueRecord;

    })(AbstractRecord(uniqueIdName, valueFields));
  };

}).call(this);
