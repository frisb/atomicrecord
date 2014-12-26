(function() {
  var ActiveRecordFactory;

  ActiveRecordFactory = require('./activerecord');

  ActiveRecordFactory.PrimaryKeyResolver = require('./primarykeyresolver');

  module.exports = ActiveRecordFactory;

}).call(this);
