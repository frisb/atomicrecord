(function() {
  var DirectoryResolver, FDBoost, cache, db, fdb, path;

  FDBoost = require('fdboost')();

  path = require('path');

  fdb = FDBoost.fdb;

  db = FDBoost.db;

  cache = {};

  module.exports = DirectoryResolver = (function() {
    DirectoryResolver.prototype.rootPath = null;

    DirectoryResolver.prototype.fields = null;

    function DirectoryResolver(options) {
      var database, dataset, directoryFields, rootPath;
      database = options.database, dataset = options.dataset, directoryFields = options.directoryFields, rootPath = options.rootPath;
      this.rootPath = path.join(rootPath || 'acidrecord', database, dataset);
      if (this.rootPath.indexOf('/') === 0) {
        this.rootPath = this.rootPath.substr(1);
      }
      this.fields = directoryFields || [];
    }

    DirectoryResolver.prototype.getDirectory = function(directoryPath, callback) {
      var cb, directory;
      directory = cache[directoryPath];
      if (directory) {
        callback(directory);
      } else {
        cb = function(err, dir) {
          cache[directoryPath] = dir;
          return callback(dir);
        };
        fdb.directory.createOrOpen(db, directoryPath.split('/'), {}, cb);
      }
    };

    DirectoryResolver.prototype.resolve = function(obj, callback) {
      var directoryPath, field, _i, _len, _ref;
      directoryPath = this.rootPath;
      _ref = this.fields;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        field = _ref[_i];
        directoryPath += "/" + obj[field];
      }
      this.getDirectory(directoryPath, callback);
    };

    return DirectoryResolver;

  })();

}).call(this);
