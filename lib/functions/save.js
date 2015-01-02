(function() {
  var save;

  save = function(tr, record, callback) {
    var cb;
    cb = function(arr) {
      var kv, _i, _len;
      for (_i = 0, _len = arr.length; _i < _len; _i++) {
        kv = arr[_i];
        tr.set(kv[0], kv[1]);
      }
      record.reset(true);
      return callback(null);
    };
    return record.serialize(cb);
  };

  module.exports = function(tr, callback) {
    if (typeof tr === 'function') {
      callback = tr;
      tr = null;
    }
    return fdb.future.create((function(_this) {
      return function(futureCb) {
        var complete;
        complete = function(err) {
          return futureCb(err, _this);
        };
        return transactionalSave(tr || db, _this, complete);
      };
    })(this), callback);
  };

}).call(this);
