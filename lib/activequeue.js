(function() {
  var ActiveList, ActiveQueue, FDBoost, db,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  ActiveList = require('./activelist');

  FDBoost = require('fdboost')();

  db = FDBoost.db;

  module.exports = ActiveQueue = (function(_super) {
    __extends(ActiveQueue, _super);

    function ActiveQueue(recordsOrSize, options) {
      var complete, transaction;
      ActiveQueue.__super__.constructor.call(this, recordsOrSize);
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

    ActiveQueue.prototype.save = function(tr, callback) {
      var cb;
      cb = (function(_this) {
        return function(err) {
          if (!err) {
            _this.length = 0;
          }
          return callback(err);
        };
      })(this);
      ActiveQueue.__super__.save.call(this, tr, cb);
    };

    return ActiveQueue;

  })(ActiveList);

}).call(this);
