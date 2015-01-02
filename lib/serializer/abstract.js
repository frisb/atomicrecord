(function() {
  var AbstractSerializer, FDBoost, fdb;

  FDBoost = require('fdboost')();

  fdb = FDBoost.fdb;

  module.exports = AbstractSerializer = (function() {
    function AbstractSerializer(ActiveRecord) {
      this.ActiveRecord = ActiveRecord;
      this.keyFrag = this.ActiveRecord.keyFrag;
    }

    AbstractSerializer.prototype.state = [];

    AbstractSerializer.prototype.cursor = null;

    AbstractSerializer.prototype.key = null;

    AbstractSerializer.prototype.serialize = function(record, callback) {
      return fdb.future.create((function(_this) {
        return function(futureCb) {
          var complete;
          complete = function(directory) {
            process.nextTick(function() {
              futureCb(_this.encode(directory, record));
            });
          };
          return _this.keyFrag.resolveDirectory(record, complete);
        };
      })(this), callback);
    };

    AbstractSerializer.prototype.encode = function(directory, record) {
      throw new Error('not implemented');
    };

    AbstractSerializer.prototype.deserialize = function(directory, keyValuePairs, callback) {
      return fdb.future.create((function(_this) {
        return function(futureCb) {
          if (!(keyValuePairs instanceof Array)) {
            keyValuePairs = [keyValuePairs];
          }
          return process.nextTick(function() {
            var kv, _i, _len;
            for (_i = 0, _len = keyValuePairs.length; _i < _len; _i++) {
              kv = keyValuePairs[_i];
              _this.key = directory.unpack(kv.key);
              _this.cursor = _this.decode(directory, kv);
              _this.cursor.keySize += kv.key.length;
              _this.cursor.valueSize += kv.value.length;
            }
            if (_this.state.length > 0) {
              futureCb(_this.state);
              return _this.state = [];
            }
          });
        };
      })(this), callback);
    };

    AbstractSerializer.prototype.decode = function(directory, buffer) {
      throw new Error('not implemented');
    };

    return AbstractSerializer;

  })();

}).call(this);
