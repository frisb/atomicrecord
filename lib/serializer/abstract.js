(function() {
  var AbstractSerializer;

  module.exports = AbstractSerializer = (function() {
    AbstractSerializer.prototype.assembled = [];

    AbstractSerializer.prototype.currentRecord = null;

    AbstractSerializer.prototype.key = null;

    function AbstractSerializer(ActiveRecordPrototype) {
      this.ActiveRecordPrototype = ActiveRecordPrototype;
    }

    AbstractSerializer.prototype.serialize = function(record, callback) {
      var complete;
      complete = (function(_this) {
        return function(directory) {
          process.nextTick(function() {
            return callback(_this.encode(directory, record));
          });
        };
      })(this);
      return record.resolveDirectory(complete);
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
            _this.currentRecord = _this.decode(kv.value);
            _this.currentRecord.keySize += kv.key.length;
            _this.currentRecord.valueSize += kv.value.length;
          }
          if (_this.assembled.length > 0) {
            callback(_this.assembled);
            return _this.assembled = [];
          }
        };
      })(this));
    };

    AbstractSerializer.prototype.decode = function(foundationDBValue) {
      throw new Error('not implemented');
    };

    return AbstractSerializer;

  })();

}).call(this);
