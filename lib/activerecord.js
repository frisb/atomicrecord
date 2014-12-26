(function() {
  var AbstractRecord, SerializerFactory,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  AbstractRecord = require('./abstractrecord');

  SerializerFactory = require('./serializer/factory');

  module.exports = function(options) {
    var ActiveRecord, FDBoost, PrimaryKey, database, dataset, db, fdb, getSerializer, keyFields, partition, primaryKey, primarykey, save, serializer, transactionalSave, valueFields;
    if (!options) {
      throw new Error('No AcidRecord options specified.');
    }
    fdb = options.fdb, database = options.database, dataset = options.dataset, partition = options.partition, keyFields = options.keyFields, valueFields = options.valueFields, primarykey = options.primarykey;
    if (!database) {
      throw new Error('Database name not specified.');
    }
    if (!dataset) {
      throw new Error('Dataset name not specified.');
    }
    FDBoost = require('fdboost')(fdb);
    fdb = FDBoost.fdb;
    db = FDBoost.db;
    PrimaryKey = require('./primarykey');
    primaryKey = new PrimaryKey(database, dataset, primarykey);
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
        var kv, _i, _len;
        for (_i = 0, _len = arr.length; _i < _len; _i++) {
          kv = arr[_i];
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


      /**
       * Creates a new Record instance
       * @class
       * @param {object} record Record object initializer.
       * @return {Record} a Record instance.
       */

      function ActiveRecord(record) {
        var idName, src, val;
        ActiveRecord.__super__.constructor.call(this);
        if (record) {
          for (src in record) {
            val = record[src];
            this.setValue(src, val);
          }
        }
        idName = primaryKey.idName;
        if (!(record && record[primaryKey.idName])) {
          this[primaryKey.idName] = primaryKey.factory.generateId();
        }
      }

      ActiveRecord.prototype.keySize = 0;

      ActiveRecord.prototype.valueSize = 0;

      ActiveRecord.prototype.partition = partition;

      ActiveRecord.prototype.data = function(dest, val) {
        if (dest && typeof val === 'undefined') {
          val = ActiveRecord.__super__.data.call(this, dest);
          if (dest !== primaryKey.idName && val instanceof Buffer) {
            val = FDBoost.encoding.decode(val);
            this.data(dest, val);
          }
          return val;
        }
        return ActiveRecord.__super__.data.call(this, dest, val);
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

      ActiveRecord.finder = require('./finder');

      ActiveRecord.primaryKey = primaryKey;

      ActiveRecord.serializer = getSerializer(ActiveRecord);

      ActiveRecord.transactional = function(func) {
        return fdb.transactional(func);
      };

      ActiveRecord.doTransaction = function(transaction, callback) {
        return db.doTransaction(transaction, callback);
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

    })(AbstractRecord(primaryKey.idName, valueFields));
  };

}).call(this);
