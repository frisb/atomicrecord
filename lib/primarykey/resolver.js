(function() {
  var FDBoost, Resolver, db, directories, fdb;

  FDBoost = require('fdboost')();

  fdb = FDBoost.fdb;

  db = FDBoost.db;

  directories = {};

  module.exports = Resolver = (function() {
    function Resolver(primaryKey) {
      this.primaryKey = primaryKey;
    }

    Resolver.prototype.resolveDirectory = function(obj, callback) {
      var cb, directory, directoryPath, field, _i, _len, _ref;
      directoryPath = this.primaryKey.getRootPath();
      if (directoryPath.indexOf('/') === 0) {
        directoryPath = directoryPath.substr(1);
      }
      _ref = this.primaryKey.directoryFields;
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

    Resolver.prototype.resolveKey = function(obj) {
      var field, idName, key, val, _i, _len, _ref;
      key = [];
      idName = this.primaryKey.getIdName();
      _ref = this.primaryKey.keyFields;
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

    return Resolver;

  })();

}).call(this);
