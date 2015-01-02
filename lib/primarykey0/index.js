(function() {
  var FDBoost, ObjectID, PrimaryKey, db, directories, fdb, path;

  path = require('path');

  ObjectID = require('bson').ObjectID;

  FDBoost = require('fdboost')();

  fdb = FDBoost.fdb;

  db = FDBoost.db;

  directories = {};

  module.exports = PrimaryKey = (function() {
    function PrimaryKey(database, dataset, options) {
      var prop, val;
      this.database = database;
      this.dataset = dataset;
      if (options) {
        for (prop in options) {
          val = options[prop];
          if (typeof val === 'function') {
            PrimaryKey.prototype[prop] = val;
          }
        }
      }
    }

    PrimaryKey.prototype._fields = null;

    PrimaryKey.prototype.getDirectoryFields = function() {
      return [];
    };

    PrimaryKey.prototype.getKeyFields = function() {
      return ['id'];
    };

    PrimaryKey.prototype.getIdName = function() {
      return 'id';
    };

    PrimaryKey.prototype.generateId = function(record) {
      return new Buffer(new ObjectID().toHexString(), 'hex');
    };

    PrimaryKey.prototype.deserializeId = function(buffer) {
      return buffer.toString('hex');
    };

    PrimaryKey.prototype.getRootPath = function() {
      return path.join('acidrecord', this.database, this.dataset);
    };

    PrimaryKey.prototype.resolveDirectory = function(obj, callback) {
      var cb, directory, directoryPath, field, _i, _len, _ref;
      directoryPath = this.getRootPath();
      if (directoryPath.indexOf('/') === 0) {
        directoryPath = directoryPath.substr(1);
      }
      _ref = this.directoryFields;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        field = _ref[_i];
        directoryPath += "/" + obj[field];
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

    PrimaryKey.prototype.resolveKey = function(obj) {
      var field, idName, key, val, _i, _len, _ref;
      key = [];
      idName = this.getIdName();
      _ref = this.keyFields;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        field = _ref[_i];
        val = obj[field];
        if (field !== idName) {
          val = FDBoost.encoding.encode(val);
        }
        key.push(val);
      }
      return key;
    };

    PrimaryKey.prototype.encodeKey = function(directory, obj, keySuffix) {
      var arr;
      arr = this.resolveKey(obj);
      if (keySuffix) {
        arr = arr.concat(keySuffix);
      }
      return directory.pack(arr);
    };

    PrimaryKey.prototype.decodeKey = function(directory, buffer, obj) {
      var arr, i, val, _i, _ref;
      if (obj == null) {
        obj = {};
      }
      arr = directory.unpack(buffer);
      for (i = _i = 0, _ref = this.keyFields.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        val = arr[i];
        if (i !== this.keyFields.length - 1) {
          val = FDBoost.encoding.decode(val);
        }
        obj[this.keyFields[i]] = val;
      }
      return obj;
    };

    Object.defineProperties(PrimaryKey.prototype, {
      directoryFields: {
        get: function() {
          return this.getDirectoryFields();
        }
      },
      keyFields: {
        get: function() {
          return this.getKeyFields();
        }
      },
      idName: {
        get: function() {
          return this.getIdName();
        }
      },
      fields: {
        get: function() {
          var field, _i, _len, _ref;
          if (this._fields === null) {
            this._fields = {};
            _ref = this.directoryFields.concat(this.keyFields);
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              field = _ref[_i];
              this._fields[field] = 1;
            }
          }
          return this._fields;
        }
      }
    });

    return PrimaryKey;

  })();

}).call(this);
