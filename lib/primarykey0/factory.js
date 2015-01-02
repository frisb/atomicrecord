(function() {
  var Factory, ObjectID;

  ObjectID = require('bson').ObjectID;

  module.exports = Factory = (function() {
    function Factory(primaryKey) {
      this.primaryKey = primaryKey;
    }

    Factory.prototype.generateId = function(record) {
      return new Buffer(new ObjectID().toHexString(), 'hex');
    };

    Factory.prototype.deserializeId = function(buffer) {
      return buffer.toString('hex');
    };

    return Factory;

  })();

}).call(this);
