(function() {
  var FDBoost, resolve;

  FDBoost = require('fdboost')();

  module.exports = resolve = function(rec, key) {
    var data, i, resolvedKey, subkey, _i, _len;
    resolvedKey = new Array(key.length);
    for (i = _i = 0, _len = key.length; _i < _len; i = ++_i) {
      subkey = key[i];
      if (typeof subkey === 'function') {
        data = subkey(rec);
      } else {
        data = rec.data(subkey);
      }
      resolvedKey[i] = FDBoost.encoding.encode(data);
    }
    return resolvedKey;
  };

}).call(this);
