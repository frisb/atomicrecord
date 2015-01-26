var AbstractRecord,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

AbstractRecord = require('./abstractrecord');


/**
 * Create an AtomicRecord class 
 * @method
 * @param {object} options AtomicRecord type specific options.
 * @param {object} [options.fdb=undefined] fdb API instance.
 * @param {string} options.database Database name.
 * @param {string} options.dataset Data collection name.
 * @param {Boolean} options.partition Flag if AtomicRecord type instance storage is partitioned.
 * @param {string[]|object} options.fields AliasMap initializer.
 * @param {object} [options.primaryKey] Override methods for keyfrag Primary Key generator.
 * @return {AtomicRecord} an AtomicRecord class
 */

module.exports = function(options) {
  var AtomicIndex, AtomicRecord, FDBoost, Index, KeyFrag, SerializerFactory, activeIndexes, database, dataset, db, fdb, fields, index, indexName, indexes, keyFrag, partition, primaryKey, remove, save, transactionalIndex, transactionalRemove, transactionalSave;
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
  AtomicIndex = require('./atomicindex');
  KeyFrag = require('./keyfrag');
  SerializerFactory = require('./serializer/factory');
  keyFrag = new KeyFrag(database, dataset, primaryKey);
  activeIndexes = {
    names: []
  };
  for (indexName in indexes) {
    index = indexes[indexName];
    Index = AtomicIndex(indexName, index);
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
        return callback(null, record);
      }
    };
    return record.serialize(cb);
  };
  remove = function(tr, record, callback) {
    tr.clear(record.key);

    /* todo: delete indexes keys */

    /* callback since if db.clear returns future */
    return callback(null);
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
  transactionalRemove = fdb.transactional(remove);
  transactionalIndex = fdb.transactional(index);
  return AtomicRecord = (function(_super) {
    __extends(AtomicRecord, _super);


    /**
     * Creates a new typed AtomicRecord instance
     * @class
     * @param {object} [record] Record object initializer.
     * @return {Record} a typed AtomicRecord instance.
     */

    function AtomicRecord(initializer) {
      var src, val;
      AtomicRecord.__super__.constructor.call(this);
      if (initializer) {
        switch (typeof initializer) {
          case 'string':
          case 'number':
            this[keyFrag.idName] = keyFrag.serializeId(initializer);
            break;
          case 'object':
            for (src in initializer) {
              val = initializer[src];
              if (src === keyFrag.idName) {
                this[src] = keyFrag.serializeId(val);
              } else {
                this[src] = val;
              }
            }
            break;
          default:
            throw new Error('Initializer must be a record, string or number');
        }
      }
    }


    /* Initializers */

    AtomicRecord.prototype.database = database;

    AtomicRecord.prototype.dataset = dataset;

    AtomicRecord.prototype.keySize = 0;

    AtomicRecord.prototype.valueSize = 0;

    AtomicRecord.prototype.partition = partition;

    AtomicRecord.prototype._key = null;

    AtomicRecord.prototype._keyValueSize = null;


    /**
     * Get / Set internal value for property alias.
     * @virtual
     * @param {string} dest Destination property alias.
     * @param {object} val Optional value to set.
     * @return {object} Value if val undefined.
     */

    AtomicRecord.prototype.data = function(dest, val) {
      if (dest && typeof val === 'undefined') {
        val = AtomicRecord.__super__.data.call(this, dest);

        /* Decode the value if the dest param is not equal to keyFrag.idName and the type of val is Buffer */
        if (dest !== keyFrag.idName && val instanceof Buffer) {
          val = FDBoost.encoding.decode(val);
          this.data(dest, val);
        }
        return val;
      }
      return AtomicRecord.__super__.data.call(this, dest, val);
    };


    /**
     * The callback format for the save method
     * @callback saveCallback
     * @param {Error} err An error instance representing the error during the execution.
     * @param {AtomicRecord} record The current AtomicRecord instance if the save method was successful.
     */


    /**
     * Persists record to the database
     * @method
     * @param {object} [tr=null] Transaction.
     * @param {saveCallback} callback Calback.
     * @return {Future}
     */

    AtomicRecord.prototype.save = function(tr, callback) {
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


    /**
     * Deletes record from the database
     * @method
     * @param {object} [tr=null] Transaction.
     * @param {saveCallback} callback Calback.
     * @return {Future}
     */

    AtomicRecord.prototype.remove = function(tr, callback) {
      if (typeof tr === 'function') {
        callback = tr;
        tr = null;
      }
      return fdb.future.create((function(_this) {
        return function(futureCb) {
          return transactionalRemove(tr || db, _this, futureCb);
        };
      })(this), callback);
    };

    AtomicRecord.prototype.index = function(tr, callback) {
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

    AtomicRecord.prototype.serialize = function(callback) {

      /* generate an Id if none has been set */
      if (!this[keyFrag.idName]) {
        this[keyFrag.idName] = keyFrag.generateId();
      }
      return AtomicRecord.serializer.serialize(this, callback);
    };


    /* Define getters and setters */

    Object.defineProperties(AtomicRecord.prototype, {
      key: {
        get: function() {
          if (this._key === null) {
            throw new Error('Record must be loaded or saved to generate key');
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

    AtomicRecord.keyFrag = keyFrag;

    AtomicRecord.serializer = SerializerFactory.create(AtomicRecord);

    AtomicRecord.fdb = fdb;

    AtomicRecord.db = db;

    AtomicRecord.count = function() {
      throw new Error('not implemented');
    };

    AtomicRecord.findAll = function(query, options) {
      if (options == null) {
        options = {};
      }
      options.nonTransactional = true;
      options.snapshot = true;
      return this.find(query, options);
    };

    AtomicRecord.find = require('./finder');

    AtomicRecord.index = index;

    AtomicRecord.extend = function(constructor) {
      return __extends(constructor, this);
    };

    return AtomicRecord;

  })(AbstractRecord(keyFrag.idName, fields));
};
