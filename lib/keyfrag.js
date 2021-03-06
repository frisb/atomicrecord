var ID, ObjectID, db, fdb, path;

path = require('path');

ObjectID = require('bson').ObjectID;

fdb = require('fdboost')();

db = fdb.open();

ID = require('./id');

module.exports = function(database, dataset, overrides) {
  var KeyFrag, directories, getDirectory;
  directories = {};
  getDirectory = function(dirPath, fnName, callback) {
    var cb, directory;
    directory = directories[dirPath];
    if (directory) {
      callback(null, directory);
    } else {
      cb = function(err, dir) {
        if (err) {
          if (err.message === 'The directory does not exist.') {
            err = "Directory path \"" + dirPath + "\" does not exist.";
          }
          return callback(err);
        } else {
          directories[dirPath] = dir;
          return callback(null, dir);
        }
      };
      fdb.directory[fnName](db, dirPath.split('/'), {}, cb);
    }
  };
  KeyFrag = (function() {
    function KeyFrag() {
      var prop, val;
      if (overrides) {
        for (prop in overrides) {
          val = overrides[prop];
          if (typeof val === 'function') {
            KeyFrag.prototype[prop] = val;
          }
        }
      }
    }

    KeyFrag.prototype.database = database;

    KeyFrag.prototype.dataset = dataset;

    KeyFrag.prototype._fields = null;

    KeyFrag.prototype.getDirectoryFields = function() {
      return [];
    };

    KeyFrag.prototype.getKeyFields = function() {
      return ['id'];
    };

    KeyFrag.prototype.getIdName = function() {
      return 'id';
    };

    KeyFrag.prototype.generateId = function() {
      return this.serializeId(new ObjectID().toHexString());
    };

    KeyFrag.prototype.serializeId = function(hexStr) {
      return new ID(hexStr);
    };

    KeyFrag.prototype.deserializeId = function(id) {
      return id.toString();
    };

    KeyFrag.prototype.getRootPath = function() {
      return path.join('atomicrecord', this.database, this.dataset);
    };

    KeyFrag.prototype.getDirectoryPath = function(obj) {
      var dirPath, field, _i, _len, _ref;
      dirPath = this.getRootPath();
      if (dirPath.indexOf('/') === 0) {
        dirPath = dirPath.substr(1);
      }
      _ref = this.directoryFields;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        field = _ref[_i];
        dirPath += "/" + obj[field];
      }
      return dirPath;
    };

    KeyFrag.prototype.resolveDirectory = function(obj, callback) {
      getDirectory(this.getDirectoryPath(obj), 'open', callback);
    };

    KeyFrag.prototype.resolveOrCreateDirectory = function(obj, callback) {
      getDirectory(this.getDirectoryPath(obj), 'createOrOpen', callback);
    };

    KeyFrag.prototype.resolveKey = function(obj) {
      var field, idName, key, val, _i, _len, _ref;
      key = [];
      idName = this.getIdName();
      _ref = this.keyFields;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        field = _ref[_i];
        val = obj[field];
        if (field !== idName) {
          val = fdb.encoding.encode(val);
        }
        key.push(val);
      }
      return key;
    };

    KeyFrag.prototype.encodeKey = function(directory, obj, keySuffix) {
      var keyArr;
      keyArr = this.resolveKey(obj);
      if (keySuffix) {
        keyArr = keyArr.concat(keySuffix);
      }

      /* Store key internally in record if obj is an ActiveRecord instance */
      if (obj.__proto__.hasOwnProperty('key')) {
        obj.key = keyArr;
      }
      return directory.pack(keyArr);
    };

    KeyFrag.prototype.decodeKey = function(directory, buffer, obj) {
      var i, keyArr, val, _i, _ref;
      keyArr = directory.unpack(buffer);
      for (i = _i = 0, _ref = this.keyFields.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        val = keyArr[i];
        if (i !== this.keyFields.length - 1) {
          val = fdb.encoding.decode(val);
        }
        obj[this.keyFields[i]] = val;
      }
    };

    KeyFrag.prototype.decodeDirectory = function(directory, obj) {
      var i, start, _i, _ref;
      start = directory._path.length - this.directoryFields.length;
      for (i = _i = start, _ref = directory._path.length; start <= _ref ? _i < _ref : _i > _ref; i = start <= _ref ? ++_i : --_i) {
        obj[this.directoryFields[i - start]] = directory._path[i];
      }
    };

    Object.defineProperties(KeyFrag.prototype, {
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

    return KeyFrag;

  })();
  return new KeyFrag();
};
