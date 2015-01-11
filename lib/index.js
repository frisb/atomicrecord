(function() {
  var AcidRecord;

  AcidRecord = require('./activerecord');

  AcidRecord.List = require('./activelist');

  module["export"] = AcidRecord;

}).call(this);
