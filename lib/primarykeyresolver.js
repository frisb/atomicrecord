(function() {
  var CustomPK, FDBoost, PrimaryKey, db, directories, fdb, path,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  FDBoost = require('fdboost')();

  path = require('path');

  fdb = FDBoost.fdb;

  db = FDBoost.db;

  directories = {};

  module.exports = PrimaryKey = (function() {
    PrimaryKey.prototype._fieldExclusions = null;

    PrimaryKey.extend = function(superConstructor) {
      return __extends(superConstructor, this);
    };

    function PrimaryKey(database, dataset) {
      this.database = database;
      this.dataset = dataset;
    }

    PrimaryKey.prototype.getRootPath = function() {
      return path.join('acidrecord', this.database, this.dataset);
    };

    PrimaryKey.prototype.getKeyFields = function() {
      return ['id'];
    };

    PrimaryKey.prototype.getDirectoryFields = function() {
      return [];
    };

    PrimaryKey.prototype.resolveDirectory = function(obj, callback) {
      var cb, directory, directoryPath, field, _i, _len, _ref;
      directoryPath = this.getRootPath();
      if (directoryPath.indexOf('/') === 0) {
        directoryPath = directoryPath.substr(1);
      }
      _ref = this.fields;
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
      var field, _i, _len, _ref, _results;
      _ref = this.getKeyFields();
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        field = _ref[_i];
        _results.push(FDBoost.encoding.encode(record[field]));
      }
      return _results;
    };

    PrimaryKey.prototype.encode = function(obj, callback) {
      return resolveDirectory(obj, function(directory) {
        var key;
        key = directory.pack(this.resolveKey(obj));
        return callback(key);
      });
    };

    PrimaryKey.prototype.decode = function(directory, buffer, record) {
      if (record == null) {
        record = {};
      }
    };

    Object.defineProperty(PrimaryKey.prototype, 'fields', {
      get: function() {
        var field, _i, _len, _ref;
        if (_fieldExclusions === null) {
          _ref = this.getDirectoryFields().concat(this.getKeyFields());
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            field = _ref[_i];
            _fieldExclusions[field] = 1;
          }
        }
        return _fieldExclusions;
      }
    });

    return PrimaryKey;

  })();

  CustomPK = (function(_super) {
    __extends(CustomPK, _super);

    function CustomPK() {
      return CustomPK.__super__.constructor.apply(this, arguments);
    }

    CustomPK.prototype.getKeyFields = function() {
      return ['timestamp', 'id'];
    };

    CustomPK.prototype.getDirectoryFields = function() {
      return ['carrier'];
    };

    return CustomPK;

  })(PrimaryKey);

}).call(this);
