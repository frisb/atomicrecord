(function() {
  var MultiKeySerializer, SerializerFactory, UniKeySerializer;

  MultiKeySerializer = require('./multikey');

  UniKeySerializer = require('./unikey');

  module.exports = SerializerFactory = (function() {
    function SerializerFactory(ActiveRecordPrototype) {
      this.multi = new MultiKeySerializer(ActiveRecordPrototype);
      this.uni = new UniKeySerializer(ActiveRecordPrototype);
    }

    SerializerFactory.prototype.get = function(partition) {
      if (partition) {
        return this.multi;
      } else {
        return this.uni;
      }
    };

    return SerializerFactory;

  })();

}).call(this);
