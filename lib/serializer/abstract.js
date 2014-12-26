(function() {
  var AbstractSerializer;

  module.exports = AbstractSerializer = (function() {
    function AbstractSerializer(ActiveRecordPrototype) {
      this.ActiveRecordPrototype = ActiveRecordPrototype;
      this.primaryKey = this.ActiveRecordPrototype.primaryKey;
    }

    AbstractSerializer.prototype.state = [];

    AbstractSerializer.prototype.cursor = null;

    AbstractSerializer.prototype.key = null;

    AbstractSerializer.prototype.serialize = function(record, callback) {
      var complete;
      complete = (function(_this) {
        return function(directory) {
          return process.nextTick(function() {
            callback(_this.encode(directory, record));
          });
        };
      })(this);
      return this.primaryKey.resolver.resolveDirectory(record, complete);
    };

    AbstractSerializer.prototype.encode = function(directory, record) {
      throw new Error('not implemented');
    };

    AbstractSerializer.prototype.deserialize = function(directory, keyValuePairs, callback) {
      if (!(keyValuePairs instanceof Array)) {
        keyValuePairs = [keyValuePairs];
      }
      return process.nextTick((function(_this) {
        return function() {
          var kv, _i, _len;
          for (_i = 0, _len = keyValuePairs.length; _i < _len; _i++) {
            kv = keyValuePairs[_i];
            _this.key = directory.unpack(kv.key);
            _this.cursor = _this.decode(directory, kv);
            _this.cursor.keySize += kv.key.length;
            _this.cursor.valueSize += kv.value.length;
          }
          if (_this.state.length > 0) {
            callback(_this.state);
            return _this.state = [];
          }
        };
      })(this));
    };

    AbstractSerializer.prototype.decode = function(directory, buffer) {
      throw new Error('not implemented');
    };

    return AbstractSerializer;

  })();

}).call(this);
