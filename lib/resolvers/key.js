(function() {
  var FDBoost, KeyResolver;

  FDBoost = require('fdboost')();

  module.exports = KeyResolver = (function() {
    function KeyResolver(idField, fields) {
      this.idField = idField;
      this.fields = fields != null ? fields : [];
    }

    KeyResolver.prototype.resolve = function(record, keySuffix) {
      var arr, field, fieldsLen, i, size, _i, _j, _len, _len1, _ref;
      fieldsLen = this.fields.length;
      size = fieldsLen + 1;
      if (keySuffix) {
        size += keySuffix.length;
      }
      arr = new Array(size);
      _ref = this.fields;
      for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
        field = _ref[i];
        arr[i] = FDBoost.encoding.encode(record[field]);
      }
      arr[fieldsLen] = record[this.idField];
      if (keySuffix) {
        for (i = _j = 0, _len1 = keySuffix.length; _j < _len1; i = ++_j) {
          field = keySuffix[i];
          arr[fieldsLen + i] = field;
        }
      }
      return arr;
    };

    return KeyResolver;

  })();

}).call(this);
