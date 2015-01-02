(function() {
  var Encoder, FDBoost;

  FDBoost = require('fdboost')();

  module.exports = Encoder = (function() {
    function Encoder(primaryKey) {
      this.primaryKey = primaryKey;
    }

    Encoder.prototype.encodeKey = function(directory, obj, keySuffix) {
      var arr;
      arr = this.primaryKey.resolver.resolveKey(obj);
      if (keySuffix) {
        arr = arr.concat(keySuffix);
      }
      return directory.pack(arr);
    };

    Encoder.prototype.decodeKey = function(directory, buffer, obj) {
      var arr, i, val, _i, _ref;
      if (obj == null) {
        obj = {};
      }
      arr = directory.unpack(buffer);
      for (i = _i = 0, _ref = this.primaryKey.keyFields.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        val = arr[i];
        if (i !== this.primaryKey.keyFields.length - 1) {
          val = FDBoost.encoding.decode(val);
        }
        obj[this.primaryKey.keyFields[i]] = val;
      }
      return obj;
    };

    return Encoder;

  })();

}).call(this);
