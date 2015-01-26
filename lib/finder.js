var FDBoost, fdb,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

FDBoost = require('fdboost')();

fdb = FDBoost.fdb;

module.exports = function(query, options) {
  var Finder, keyFrag, serializer;
  if (options == null) {
    options = {};
  }
  keyFrag = this.keyFrag;
  serializer = this.serializer;
  Finder = (function(_super) {
    __extends(Finder, _super);

    function Finder() {
      return Finder.__super__.constructor.apply(this, arguments);
    }

    Finder.prototype.finalize = function(err, callback) {
      if (serializer.state.length > 0) {
        this.emit('data', serializer.state);
      } else if (serializer.cursor !== null) {
        serializer.cursor.reset(true);
        this.emit('data', serializer.cursor);
      }
      return callback(err);
    };


    /**
     * Iterate over array results 
     * @override
     * @param {LazyIterator} iterator LazyIterator instance.
     * @param {iterateCallback} callback Callback.
     * @fires RangeReader#data
     * @return {undefined}
     */

    Finder.prototype.toArray = function(iterator, callback) {
      return iterator.toArray((function(_this) {
        return function(err, arr) {
          var cb;
          cb = function(records) {
            return _this.finalize(err, callback);
          };
          serializer.deserialize(_this.directory, arr, cb);
        };
      })(this));
    };


    /**
     * Iterate over batch results 
     * @override
     * @param {LazyIterator} iterator LazyIterator instance.
     * @param {iterateCallback} callback Callback.
     * @fires RangeReader#data
     * @return {undefined}
     */

    Finder.prototype.forEachBatch = function(iterator, callback) {
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
     * @fires RangeReader#data
     * @return {undefined}
     */

    Finder.prototype.forEach = function(iterator, callback) {
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
     * Execute the finder using an iterator type 
     * @override
     * @param {object} tr Optional transaction.
     * @param {string} iteratorType batch|each|array.
     * @fires RangeReader#error
     * @fires RangeReader#continue
     * @fires RangeReader#end
     * @return {undefined}
     */

    Finder.prototype.execute = function(tr, iteratorType) {
      var callback;
      callback = (function(_this) {
        return function(err, directory) {
          _this.directory = directory;
          if (err) {
            throw new Error(err);
          }
          _this.begin = _this.directory;
          return Finder.__super__.execute.call(_this, tr, iteratorType);
        };
      })(this);
      return keyFrag.resolveDirectory(query, callback);
    };

    return Finder;

  })(FDBoost.range.Reader);
  return new Finder(options);
};
