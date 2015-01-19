(function() {
  var AtomicList, AtomicQueue, FDBoost, db,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  AtomicList = require('./atomiclist');

  FDBoost = require('fdboost')();

  db = FDBoost.db;

  module.exports = AtomicQueue = (function(_super) {
    __extends(AtomicQueue, _super);

    function AtomicQueue(recordsOrSize, options) {
      var complete, transaction;
      AtomicQueue.__super__.constructor.call(this, recordsOrSize);
      if (!options) {
        if (typeof recordsOrSize === 'object' && !(recordsOrSize instanceof Array)) {
          options = recordsOrSize;
        } else {
          options = {};
        }
      }
      if (options.batchSaveDelay) {
        transaction = (function(_this) {
          return function(tr, callback) {
            return _this.save(tr, callback);
          };
        })(this);
        complete = function(err) {};
        setInterval((function(_this) {
          return function() {
            if (_this.length > 0) {
              return db.doTransaction(transaction, complete);
            }
          };
        })(this), options.batchSaveDelay);
      }
    }

    AtomicQueue.prototype.save = function(tr, callback) {
      var cb;
      cb = (function(_this) {
        return function(err) {
          if (!err) {
            _this.length = 0;
          }
          return callback(err);
        };
      })(this);
      AtomicQueue.__super__.save.call(this, tr, cb);
    };

    return AtomicQueue;

  })(AtomicList);

}).call(this);
