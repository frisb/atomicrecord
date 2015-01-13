(function() {
  var ActiveList, EventEmitter, FDBoost, db, fdb, save, transactionalSave,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  EventEmitter = require('events').EventEmitter;

  FDBoost = require('fdboost')();

  fdb = FDBoost.fdb;

  db = FDBoost.db;

  save = function(tr, list, callback) {
    var cb, len, record, saved, _i, _len, _ref;
    len = list.length;
    saved = 0;
    cb = function(err) {
      if (err) {
        return callback(err);
      } else {
        list.emit('recordsaved', record);
        saved++;
        if (saved === len) {
          return callback(null);
        }
      }
    };
    _ref = list._records;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      record = _ref[_i];
      record.save(tr, cb);
    }
  };

  transactionalSave = fdb.transactional(save);

  module.exports = ActiveList = (function(_super) {
    __extends(ActiveList, _super);

    function ActiveList(recordsOrSize) {
      var i, record, _i, _len;
      ActiveList.__super__.constructor.call(this);
      if (recordsOrSize instanceof Array) {
        this._records = new Array(recordsOrSize.length);
        for (i = _i = 0, _len = recordsOrSize.length; _i < _len; i = ++_i) {
          record = recordsOrSize[i];
          this._records[i] = record;
        }
      } else if (typeof recordsOrSize === 'number') {
        this._records = new Array(recordsOrSize);
      } else {
        if (this._records === null) {
          this._records = [];
        }
      }
    }

    ActiveList.prototype._records = null;

    ActiveList.prototype.add = function(record) {
      return this._records.push(record);
    };

    ActiveList.prototype.save = function(tr, callback) {
      if (typeof tr === 'function') {
        callback = tr;
        tr = null;
      }
      fdb.future.create((function(_this) {
        return function(futureCb) {
          var complete, len;
          len = _this.length;
          complete = function(err) {
            if (err) {
              _this.emit('error', err);
              return futureCb(err);
            } else {
              _this.emit('saved', len);
              return futureCb(null, len);
            }
          };
          transactionalSave(tr || db, _this, complete);
        };
      })(this), callback);
    };

    Object.defineProperty(ActiveList.prototype, 'length', {
      get: function() {
        return this._records.length;
      },
      set: function(val) {
        return this._records.length = val;
      }
    });

    return ActiveList;

  })(EventEmitter);

}).call(this);
