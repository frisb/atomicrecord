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
  var AtomicIndex, AtomicRecord, Index, SerializerFactory, activeIndexes, database, dataset, db, fdb, fields, index, indexName, indexes, keyFrag, partition, primaryKey, remove, save, transactionalIndex, transactionalRemove, transactionalSave;
  if (!options) {
    throw new Error('No AtomicRecord options specified.');
  }
  fdb = options.fdb, database = options.database, dataset = options.dataset, partition = options.partition, fields = options.fields, primaryKey = options.primaryKey, indexes = options.indexes;
  if (!database) {
    throw new Error('Database name not specified.');
  }
  if (!dataset) {
    throw new Error('Dataset name not specified.');
  }
  fdb = require('fdboost')(fdb);
  db = fdb.open();
  AtomicIndex = require('./atomicindex');
  SerializerFactory = require('./serializer/factory');
  keyFrag = require('./keyfrag')(database, dataset, primaryKey);
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
          val = fdb.encoding.decode(val);
          this.data(dest, val);
        }
        return val;
      }
      return AtomicRecord.__super__.data.call(this, dest, val);
    };

    AtomicRecord.prototype.getKey = function(callback) {
      if (this.key !== null) {
        return callback(null, key);
      } else {
        return keyFrag.resolveDirectory(this, (function(_this) {
          return function(err, directory) {
            if (err) {
              return callback(err);
            } else {
              _this.key = keyFrag.encodeKey(directory, _this);
              return callback(null, _this.key);
            }
          };
        })(this));
      }
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
      var aliasMapHasId, recordHasId;
      recordHasId = typeof this[keyFrag.idName] !== 'undefined';
      aliasMapHasId = typeof this.aliasMap.srcIndex[keyFrag.idName] !== 'undefined';
      if (!recordHasId && aliasMapHasId) {
        this[keyFrag.idName] = keyFrag.generateId();
      }
      return AtomicRecord.serializer.serialize(this, callback);
    };


    /* Define getters and setters */

    Object.defineProperties(AtomicRecord.prototype, {
      key: {
        get: function() {
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

    AtomicRecord.transactional = function(func) {
      return fdb.transactional(func);
    };

    AtomicRecord.doTransaction = function(transaction, callback) {
      return db.doTransaction(transaction, callback);
    };

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

    AtomicRecord.findOne = function(tr, query, callback) {
      if (typeof query === 'function') {
        callback = query;
        query = tr;
        tr = null;
      } else if (!query) {
        query = tr;
        tr = null;
      }
      return fdb.future.create((function(_this) {
        return function(futureCb) {
          var finder, record;
          record = null;
          finder = _this.find(query, {
            limit: 1
          });
          finder.on('data', function(data) {
            record = data[0];
          });
          finder.on('error', function(err) {
            futureCb(err);
          });
          finder.on('end', function() {
            futureCb(null, record);
          });
          return finder.execute(tr, 'array');
        };
      })(this), callback);
    };

    AtomicRecord.remove = require('./remover');

    AtomicRecord.index = index;

    AtomicRecord.extend = function(child) {
      var childProto, k, propName, v, _i, _len, _ref;
      childProto = {};
      _ref = Object.getOwnPropertyNames(child.prototype);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        propName = _ref[_i];
        childProto[propName] = child.prototype[propName];
      }
      __extends(child, AtomicRecord);
      for (k in childProto) {
        v = childProto[k];
        child.prototype[k] = v;
      }
      AtomicRecord.serializer.AtomicRecord = child;
      return child;
    };

    return AtomicRecord;

  })(AbstractRecord(fields));
};
