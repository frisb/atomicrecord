(function() {
  module.exports = function(indexName, index) {
    var AtomicIndex;
    return AtomicIndex = (function() {
      var createTest, field, value, _ref;

      function AtomicIndex() {}

      AtomicIndex.prototype.name = indexName;

      AtomicIndex.prototype.tests = [];

      AtomicIndex.prototype.execute = function(tr, directory, record) {
        if (this.test(record)) {
          console.log('directory', directory);
          return console.log('index', this.name);
        }
      };

      AtomicIndex.prototype.test = function(record) {
        var testName, valid, _i, _len, _ref;
        _ref = this.tests;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          testName = _ref[_i];
          valid = this[testName](record);
          if (valid) {
            continue;
          }
          return false;
        }
        return true;
      };

      createTest = function(testName, field, value) {
        AtomicIndex.prototype[testName] = function(record) {
          if (record[field] === value) {
            return true;
          }
          return false;
        };
        return AtomicIndex.prototype.tests.push(testName);
      };

      if (index.condition) {
        if (typeof index.condition === 'function') {
          AtomicIndex.prototype.test = index.condition;
        } else {
          _ref = index.condition;
          for (field in _ref) {
            value = _ref[field];
            createTest("test" + field, field, value);
          }
        }
      }

      return AtomicIndex;

    })();
  };

}).call(this);
