(function() {
  module.exports = function(indexName, index) {
    var ActiveIndex;
    return ActiveIndex = (function() {
      var createTest, field, value, _ref;

      function ActiveIndex() {}

      ActiveIndex.prototype.name = indexName;

      ActiveIndex.prototype.tests = [];

      ActiveIndex.prototype.execute = function(tr, directory, record) {
        if (this.test(record)) {
          console.log('directory', directory);
          return console.log('index', this.name);
        }
      };

      ActiveIndex.prototype.test = function(record) {
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
        ActiveIndex.prototype[testName] = function(record) {
          if (record[field] === value) {
            return true;
          }
          return false;
        };
        return ActiveIndex.prototype.tests.push(testName);
      };

      if (index.condition) {
        if (typeof index.condition === 'function') {
          ActiveIndex.prototype.test = index.condition;
        } else {
          _ref = index.condition;
          for (field in _ref) {
            value = _ref[field];
            createTest("test" + field, field, value);
          }
        }
      }

      return ActiveIndex;

    })();
  };

}).call(this);
