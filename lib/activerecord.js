(function() {
  var AbstractRecord, DirectoryResolver, KeyResolver, ObjectID, SerializerFactory,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  ObjectID = require('bson').ObjectID;

  AbstractRecord = require('./abstractrecord');

  DirectoryResolver = require('./resolvers/directory');

  KeyResolver = require('./resolvers/key');

  SerializerFactory = require('./serializer/factory');

  module.exports = function(options) {
    var ActiveRecord, FDBoost, database, dataset, db, directoryResolver, fdb, field, fieldExclusions, getSerializer, idName, keyFields, keyResolver, partition, pkFactory, save, serializer, transactionalSave, valueFields, _i, _j, _len, _len1, _ref, _ref1;
    if (!options) {
      throw new Error('No AcidRecord options specified.');
    }
    fdb = options.fdb, database = options.database, dataset = options.dataset, idName = options.idName, pkFactory = options.pkFactory, partition = options.partition, keyFields = options.keyFields, valueFields = options.valueFields;
    if (idName == null) {
      idName = 'id';
    }
    if (pkFactory == null) {
      pkFactory = function() {
        return new Buffer(new ObjectID().toHexString(), 'hex');
      };
    }
    if (!database) {
      throw new Error('Database name not specified.');
    }
    if (!dataset) {
      throw new Error('Dataset name not specified.');
    }
    FDBoost = require('fdboost')(fdb);
    fdb = FDBoost.fdb;
    db = FDBoost.db;
    directoryResolver = new DirectoryResolver(options);
    keyResolver = new KeyResolver(idName, keyFields);
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
    serializer = null;
    getSerializer = function(ActiveRecordPrototype) {
      var serializerFactory;
      if (serializer === null) {
        serializerFactory = new SerializerFactory(ActiveRecordPrototype);
        serializer = serializerFactory.get(partition);
      }
      return serializer;
    };
    save = function(tr, record, callback) {
      var cb;
      cb = function(arr) {
        var kv, _k, _len2;
        for (_k = 0, _len2 = arr.length; _k < _len2; _k++) {
          kv = arr[_k];
          tr.set(kv[0], kv[1]);
        }
        record.reset(true);
        return callback(null);
      };
      return record.serialize(cb);
    };
    transactionalSave = fdb.transactional(save);
    return ActiveRecord = (function(_super) {
      __extends(ActiveRecord, _super);

      ActiveRecord.directoryResolver = directoryResolver;

      ActiveRecord.keyResolver = keyResolver;

      ActiveRecord.fieldExclusions = fieldExclusions;

      ActiveRecord.Finder = require('./finder');

      ActiveRecord.deserialize = function(directory, keyValuePairs, callback) {
        return getSerializer(this).deserialize(directory, keyValuePairs, callback);
      };

      ActiveRecord.transactional = function(func) {
        return fdb.transactional(func);
      };

      ActiveRecord.doTransaction = function(transaction, callback) {
        return db.doTransaction(transaction, callback);
      };

      ActiveRecord.prototype.keySize = 0;

      ActiveRecord.prototype.valueSize = 0;

      ActiveRecord.prototype.partition = partition;


      /**
       * Creates a new Record instance
       * @class
       * @param {object} record Record object initializer.
       * @return {Record} a Record instance.
       */

      function ActiveRecord(record) {
        var src, val;
        ActiveRecord.__super__.constructor.call(this);
        if (record) {
          for (src in record) {
            val = record[src];
            this.setValue(src, val);
          }
        }
        if (!(record && record[idName])) {
          this[idName] = pkFactory();
        }
      }

      ActiveRecord.prototype.data = function(dest, val) {
        if (dest && typeof val === 'undefined') {
          val = ActiveRecord.__super__.data.call(this, dest);
          if (dest !== idName && val instanceof Buffer) {
            val = FDBoost.encoding.decode(val);
            this.data(dest, val);
          }
          return val;
        }
        return ActiveRecord.__super__.data.call(this, dest, val);
      };

      ActiveRecord.prototype.resolveDirectory = function(callback) {
        return directoryResolver.resolve(this, callback);
      };

      ActiveRecord.prototype.save = function(tr, callback) {
        if (typeof tr === 'function') {
          callback = tr;
          tr = null;
        }
        return fdb.future.create((function(_this) {
          return function(futureCb) {
            var complete;
            complete = function(err) {
              return futureCb(err, _this);
            };
            return transactionalSave(tr || db, _this, complete);
          };
        })(this), callback);
      };

      ActiveRecord.prototype.serialize = function(callback) {
        return getSerializer(ActiveRecord).serialize(this, callback);
      };

      ActiveRecord.count = function() {
        throw new Error('not implemented');
      };

      ActiveRecord.findAll = function(query, options) {
        if (options == null) {
          options = {};
        }
        options.nonTransactional = true;
        options.snapshot = true;
        return this.find(query, options);
      };

      ActiveRecord.find = require('./finder');

      Object.defineProperties(ActiveRecord.prototype, {
        keyValueSize: {
          get: function() {
            return this.keySize + this.valueSize;
          }
        }
      });

      return ActiveRecord;

    })(AbstractRecord(idName, valueFields));
  };

}).call(this);
