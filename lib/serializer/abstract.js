var AbstractSerializer, fdb;

fdb = require('fdboost')();

module.exports = AbstractSerializer = (function() {
  function AbstractSerializer(AtomicRecord) {
    this.AtomicRecord = AtomicRecord;
    this.keyFrag = this.AtomicRecord.keyFrag;
    this.state = [];
    this.cursor = null;
    this.key = null;
  }

  AbstractSerializer.prototype.serialize = function(record, callback) {
    var complete;
    complete = (function(_this) {
      return function(err, directory) {
        if (err) {
          callback(err);
        } else {
          process.nextTick(function() {
            callback(null, _this.encode(directory, record));
          });
        }
      };
    })(this);
    return this.keyFrag.resolveOrCreateDirectory(record, complete);
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
        callback(_this.state);
        return _this.state = [];
      };
    })(this));
  };

  AbstractSerializer.prototype.decode = function(directory, buffer) {
    throw new Error('not implemented');
  };

  return AbstractSerializer;

})();
