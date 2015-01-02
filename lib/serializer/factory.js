(function() {
  var MultiKeySerializer, UniKeySerializer, serializers;

  MultiKeySerializer = require('./multikey');

  UniKeySerializer = require('./unikey');

  serializers = {};

  module.exports = {
    create: function(ActiveRecord) {
      var key, serializer;
      key = "" + ActiveRecord.prototype.database + ":" + ActiveRecord.prototype.dataset;
      serializer = serializers[key];
      if (!serializer) {
        serializers[key] = serializer = {
          multi: new MultiKeySerializer(ActiveRecord),
          uni: new UniKeySerializer(ActiveRecord)
        };
      }
      if (ActiveRecord.partition) {
        return serializer.multi;
      } else {
        return serializer.uni;
      }
    }
  };

}).call(this);
