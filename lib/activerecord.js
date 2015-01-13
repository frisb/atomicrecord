(function() {
  var AbstractRecord,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  AbstractRecord = require('./abstractrecord');


  /**
   * Create an ActiveRecord class 
   * @method
   * @param {object} options ActiveRecord type specific options.
   * @param {object} [options.fdb=undefined] fdb API instance.
   * @param {string} options.database Database name.
   * @param {string} options.dataset Data collection name.
   * @param {Boolean} options.partition Flag if ActiveRecord type instance storage is partitioned.
   * @param {string[]|object} options.fields AliasMap initializer.
   * @param {object} [options.primaryKey] Override methods for keyfrag Primary Key generator.
   * @return {ActiveRecord} an ActiveRecord class
   */

  module.exports = function(options) {
    var ActiveIndex, ActiveRecord, FDBoost, Index, KeyFrag, SerializerFactory, activeIndexes, database, dataset, db, fdb, fields, index, indexName, indexes, keyFrag, partition, primaryKey, save, transactionalIndex, transactionalSave;
    if (!options) {
      throw new Error('No AcidRecord options specified.');
    }
    fdb = options.fdb, database = options.database, dataset = options.dataset, partition = options.partition, fields = options.fields, primaryKey = options.primaryKey, indexes = options.indexes;
    if (!database) {
      throw new Error('Database name not specified.');
    }
    if (!dataset) {
      throw new Error('Dataset name not specified.');
    }
    FDBoost = require('fdboost')(fdb);
    fdb = FDBoost.fdb;
    db = FDBoost.db;
    ActiveIndex = require('./activeindex');
    KeyFrag = require('./keyfrag');
    SerializerFactory = require('./serializer/factory');
    keyFrag = new KeyFrag(database, dataset, primaryKey);
    activeIndexes = {
      names: []
    };
    for (indexName in indexes) {
      index = indexes[indexName];
      Index = ActiveIndex(indexName, index);
      activeIndexes[indexName] = new Index();
      activeIndexes.names.push(indexName);
    }
    save = function(tr, record, callback) {
      var cb;
      cb = function(err, arr) {
        var kv, _i, _len;
        if (err) {
          return callback(err);
        } else {
          for (_i = 0, _len = arr.length; _i < _len; _i++) {
            kv = arr[_i];
            tr.set(kv[0], kv[1]);
          }
          record.reset(true);
          return callback(null);
        }
      };
      return record.serialize(cb);
    };
    index = function(tr, record, callback) {
      var cb;
      cb = function(err, directory) {
        var _i, _len, _ref;
        if (err) {
          return callback(err);
        } else {
          _ref = activeIndexes.names;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            indexName = _ref[_i];
            activeIndexes[indexName].execute(tr, directory, record);
          }
          return callback(null);
        }
      };
      return keyFrag.resolveDirectory(record, cb);
    };
    transactionalSave = fdb.transactional(save);
    transactionalIndex = fdb.transactional(index);
    return ActiveRecord = (function(_super) {
      __extends(ActiveRecord, _super);


      /**
       * Creates a new typed ActiveRecord instance
       * @class
       * @param {object} [record] Record object initializer.
       * @return {Record} a typed ActiveRecord instance.
       */

      function ActiveRecord(record) {
        var src, val;
        ActiveRecord.__super__.constructor.call(this);
        if (record) {
          for (src in record) {
            val = record[src];
            if (src === keyFrag.idName) {
              this[src] = keyFrag.serializeId(val);
            } else {
              this[src] = val;
            }
          }
        }
      }


      /* Initializers */

      ActiveRecord.prototype.database = database;

      ActiveRecord.prototype.dataset = dataset;

      ActiveRecord.prototype.keySize = 0;

      ActiveRecord.prototype.valueSize = 0;

      ActiveRecord.prototype.partition = partition;

      ActiveRecord.prototype._key = null;

      ActiveRecord.prototype._keyValueSize = null;


      /**
       * Get / Set internal value for property alias.
       * @virtual
       * @param {string} dest Destination property alias.
       * @param {object} val Optional value to set.
       * @return {object} Value if val undefined.
       */

      ActiveRecord.prototype.data = function(dest, val) {
        if (dest && typeof val === 'undefined') {
          val = ActiveRecord.__super__.data.call(this, dest);

          /* Decode the value if the dest param is not equal to keyFrag.idName and the type of val is Buffer */
          if (dest !== keyFrag.idName && val instanceof Buffer) {
            val = FDBoost.encoding.decode(val);
            this.data(dest, val);
          }
          return val;
        }
        return ActiveRecord.__super__.data.call(this, dest, val);
      };


      /**
       * The callback format for the save method
       * @callback saveCallback
       * @param {Error} err An error instance representing the error during the execution.
       * @param {ActiveRecord} record The current ActiveRecord instance if the save method was successful.
       */


      /**
       * Persists all property changes to the database
       * @method
       * @param {object} [tr=null] Transaction.
       * @param {saveCallback} callback Calback.
       * @return {Future}
       */

      ActiveRecord.prototype.save = function(tr, callback) {
        if (typeof tr === 'function') {
          callback = tr;
          tr = null;
        }
        return fdb.future.create((function(_this) {
          return function(futureCb) {
            return transactionalSave(tr || db, _this, futureCb);
          };
        })(this), callback);
      };

      ActiveRecord.prototype.index = function(tr, callback) {
        if (typeof tr === 'function') {
          callback = tr;
          tr = null;
        }
        return fdb.future.create((function(_this) {
          return function(futureCb) {
            return transactionalIndex(tr || db, _this, futureCb);
          };
        })(this), callback);
      };

      ActiveRecord.prototype.serialize = function(callback) {

        /* generate an Id if none has been set */
        if (!this[keyFrag.idName]) {
          this[keyFrag.idName] = keyFrag.generateId();
        }
        return ActiveRecord.serializer.serialize(this, callback);
      };


      /* Define getters and setters */

      Object.defineProperties(ActiveRecord.prototype, {
        key: {
          get: function() {
            if (this._key === null || this.isChanged) {
              this._key = keyFrag.resolveKey(this);
            }
            return this._key;
          },
          set: function(val) {
            return this._key = val;
          }
        },
        keyValueSize: {
          get: function() {
            if (this._keyValueSize === null || this.isChanged) {
              this._keyValueSize = this.keySize + this.valueSize;
            }
            return this._keyValueSize;
          }
        }
      });


      /* Static properties and methods */

      ActiveRecord.keyFrag = keyFrag;

      ActiveRecord.serializer = SerializerFactory.create(ActiveRecord);

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

      ActiveRecord.index = index;

      ActiveRecord.extend = function(constructor) {
        return __extends(constructor, this);
      };

      return ActiveRecord;

    })(AbstractRecord(keyFrag.idName, fields));
  };

}).call(this);
