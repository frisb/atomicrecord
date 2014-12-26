(function() {
  var PrimaryKey, path;

  path = require('path');

  module.exports = PrimaryKey = (function() {
    function PrimaryKey(database, dataset, options) {
      var encoder, factory, fn, fnName, resolver;
      this.database = database;
      this.dataset = dataset;
      if (options == null) {
        options = {};
      }
      encoder = options.encoder, factory = options.factory, resolver = options.resolver;
      if (encoder) {
        for (fnName in encoder) {
          fn = encoder[fnName];
          PrimaryKey.Encoder.prototype[fnName] = fn;
        }
      }
      if (factory) {
        for (fnName in factory) {
          fn = factory[fnName];
          PrimaryKey.Factory.prototype[fnName] = fn;
        }
      }
      if (resolver) {
        for (fnName in resolver) {
          fn = resolver[fnName];
          PrimaryKey.Resolver.prototype[fnName] = fn;
        }
      }
      this.encoder = new PrimaryKey.Encoder(this);
      this.factory = new PrimaryKey.Factory(this);
      this.resolver = new PrimaryKey.Resolver(this);
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

    PrimaryKey.prototype.getRootPath = function() {
      return path.join('acidrecord', this.database, this.dataset);
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

    PrimaryKey.Encoder = require('./encoder');

    PrimaryKey.Factory = require('./factory');

    PrimaryKey.Resolver = require('./resolver');

    return PrimaryKey;

  })();

}).call(this);
