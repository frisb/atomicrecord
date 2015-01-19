(function() {
  var MultiKeySerializer, UniKeySerializer, serializers;

  MultiKeySerializer = require('./multikey');

  UniKeySerializer = require('./unikey');

  serializers = {};

  module.exports = {
    create: function(AtomicRecord) {
      var key, serializer;
      key = "" + AtomicRecord.prototype.database + ":" + AtomicRecord.prototype.dataset;
      serializer = serializers[key];
      if (!serializer) {
        serializers[key] = serializer = {
          multi: new MultiKeySerializer(AtomicRecord),
          uni: new UniKeySerializer(AtomicRecord)
        };
      }
      if (AtomicRecord.partition) {
        return serializer.multi;
      } else {
        return serializer.uni;
      }
    }
  };

}).call(this);
