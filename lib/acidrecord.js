(function() {
  var KeyValueRecord, RecordQuery, directories, path, _INCREMENTAL,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  KeyValueRecord = require('./keyvaluerecord');

  RecordQuery = require('./recordquery');

  path = require('path');

  directories = {};

  _INCREMENTAL = new Buffer(4);

  _INCREMENTAL.writeUInt32LE(1, 0);

  module.exports = function(options) {
    var ActiveRecord, FDBoost, KeyResolver, database, dataset, datasetPath, db, fdb, getDirectory, rootPath, save, transactionalSave;
    if (!options) {
      throw new Error('No AcidRecord options specified.');
    }
    fdb = options.fdb, database = options.database, dataset = options.dataset, rootPath = options.rootPath, datasetPath = options.datasetPath;
    if (!database) {
      throw new Error('Database name not specified.');
    }
    if (!dataset) {
      throw new Error('Dataset name not specified.');
    }
    FDBoost = require('fdboost')(fdb);
    fdb = FDBoost.fdb;
    db = FDBoost.db;
    KeyResolver = require('./keyresolver');
    if (rootPath == null) {
      rootPath = "/acidrecord/" + database;
    }
    if (datasetPath == null) {
      datasetPath = "/datasets/" + dataset;
    }
    if (rootPath.indexOf('/') === 0) {
      rootPath = rootPath.substr(1);
    }
    getDirectory = function(rec, callback) {
      var cb, directory, directoryPath;
      if (typeof datasetPath === 'function') {
        directoryPath = path.join(rootPath, datasetPath(rec));
      } else {
        directoryPath = path.join(rootPath, datasetPath);
      }
      directory = directories[directoryPath];
      if (directory) {
        callback(directory);
      } else {
        cb = function(err, dir) {
          directories[directoryPath] = dir;
          return callback(dir);
        };
        fdb.directory.createOrOpen(db, directoryPath.split('/'), {}, cb);
      }
    };
    save = function(tr, rec, callback) {
      return getDirectory(rec, function(directory) {
        var kv, _i, _len, _ref;
        _ref = rec.toKeyValues(directory);
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          kv = _ref[_i];
          tr.set(kv[0], kv[1]);
        }
        rec.reset(true);
        return callback(null);
      });
    };
    transactionalSave = fdb.transactional(save);
    return ActiveRecord = (function(_super) {
      __extends(ActiveRecord, _super);

      function ActiveRecord() {
        return ActiveRecord.__super__.constructor.apply(this, arguments);
      }

      ActiveRecord.prototype.dataset = dataset;

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

      ActiveRecord.prototype.index = function() {
        throw new Error('not implemented');
      };

      ActiveRecord.prototype.add = function() {
        throw new Error('not implemented');
      };

      ActiveRecord.count = function() {
        throw new Error('not implemented');
      };

      ActiveRecord.findAll = function() {
        options = {
          nonTransactional: true,
          snapshot: true
        };
        return this.find(options);
      };

      ActiveRecord.find = function(options) {
        options.ActiveRecord = this;
        return new RecordQuery(options);
      };

      return ActiveRecord;

    })(KeyValueRecord(options));
  };

}).call(this);
