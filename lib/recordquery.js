(function() {
  var FDBoost, RecordQuery, fdb,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  FDBoost = require('fdboost')();

  fdb = FDBoost.fdb;

  module.exports = RecordQuery = (function(_super) {
    __extends(RecordQuery, _super);

    RecordQuery.prototype.assembled = [];

    RecordQuery.prototype.currentRecord = null;

    RecordQuery.prototype.key = null;

    function RecordQuery(options) {
      this.ActiveRecord = options.ActiveRecord;
      RecordQuery.__super__.constructor.call(this, options);
    }

    RecordQuery.prototype.parse = function(arr) {
      if (!(arr instanceof Array)) {
        arr = [arr];
      }
      return process.nextTick((function(_this) {
        return function() {
          var kv, _i, _len;
          for (_i = 0, _len = arr.length; _i < _len; _i++) {
            kv = arr[_i];
            _this.assembled.push('testKey', fdb.tuple.unpack(kv.key));
          }
          if (_this.assembled.length > 0) {
            _this.emit('data', _this.assembled);
            return _this.assembled = [];
          }
        };
      })(this));
    };

    RecordQuery.prototype.buildRecord = function(value) {
      var dest, i, id, map, obj, partitioned, values, _i, _ref;
      obj = null;
      id = this.key[0];
      partitioned = this.key.length <= 2;
      if (!partitioned) {
        obj = new this.ActiveRecord(id);
        map = new Array(this.key.length - 1);
        values = fdb.tuple.unpack(value);
        for (i = _i = 1, _ref = this.key.length; 1 <= _ref ? _i < _ref : _i > _ref; i = 1 <= _ref ? ++_i : --_i) {
          dest = this.key[i];
          obj.data(dest, values[i - 1]);
        }
        obj.reset(true);
        this.assembled.push(obj);
      } else {
        dest = this.key[1];
        if (this.currentRecord !== null) {
          obj = this.currentRecord;
          if (this.currentRecord.id !== id) {
            this.currentRecord.reset(true);
            this.assembled.push(obj);
            obj = new this.ActiveRecord(id);
          }
        } else {
          obj = new this.ActiveRecord(id);
        }
        if (dest) {
          obj.data(dest, value);
        }
      }
      return obj;
    };

    RecordQuery.prototype.finalize = function(err, callback) {
      if (this.assembled.length > 0) {
        this.emit('data', this.assembled);
      } else if (this.currentRecord !== null) {
        this.currentRecord.reset(true);
        this.emit('data', this.currentRecord);
      }
      return callback(err);
    };


    /**
     * Iterate over array results 
     * @override
     * @param {LazyIterator} iterator LazyIterator instance.
     * @param {iterateCallback} callback Callback.
     * @fires RangeQuery#data
     * @return {undefined}
     */

    RecordQuery.prototype.toArray = function(iterator, callback) {
      return iterator.toArray((function(_this) {
        return function(err, arr) {
          _this.parse(arr);
          _this.finalize(err, callback);
        };
      })(this));
    };


    /**
     * Iterate over batch results 
     * @override
     * @param {LazyIterator} iterator LazyIterator instance.
     * @param {iterateCallback} callback Callback.
     * @fires RangeQuery#data
     * @return {undefined}
     */

    RecordQuery.prototype.forEachBatch = function(iterator, callback) {
      var complete, func;
      complete = (function(_this) {
        return function(err) {
          return _this.finalize(err, callback);
        };
      })(this);
      func = (function(_this) {
        return function(arr, next) {
          _this.parse(arr);
          next();
        };
      })(this);
      return iterator.forEachBatch(func, complete);
    };


    /**
     * Iterate over key-value pair results 
     * @override
     * @param {LazyIterator} iterator LazyIterator instance.
     * @param {iterateCallback} callback Callback.
     * @fires RangeQuery#data
     * @return {undefined}
     */

    RecordQuery.prototype.forEach = function(iterator, callback) {
      var complete, func;
      complete = (function(_this) {
        return function(err) {
          return _this.finalize(err, callback);
        };
      })(this);
      func = (function(_this) {
        return function(kv, next) {
          _this.parse(kv);
          next();
        };
      })(this);
      return iterator.forEach(func, complete);
    };


    /**
     * Execute the query using an iterator type 
     * @override
     * @param {object} tr Optional transaction.
     * @param {string} iteratorType batch|each|array.
     * @fires RangeQuery#error
     * @fires RangeQuery#continue
     * @fires RangeQuery#end
     * @return {undefined}
     */

    RecordQuery.prototype.execute = function(tr, iteratorType) {
      return this.ActiveRecord.getDirectory({
        carrier: 64502
      }, (function(_this) {
        return function(directory) {
          _this.begin = directory;
          return RecordQuery.__super__.execute.call(_this, tr, iteratorType);
        };
      })(this));
    };

    return RecordQuery;

  })(FDBoost.range.Query);

}).call(this);
