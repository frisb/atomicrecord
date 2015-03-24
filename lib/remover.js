var clear, fdb, transactionalClear;

fdb = require('fdboost')();

clear = function(tr, prefix, cb) {
  tr.clearRangeStartsWith(prefix);
  cb(null);
};

transactionalClear = fdb.transactional(clear);

module.exports = function(tr, query, callback) {
  if (typeof query === 'function') {
    callback = query;
    query = tr;
    tr = null;
  } else if (!query) {
    query = tr;
    tr = null;
  }
  return fdb.future.create((function(_this) {
    return function(futureCb) {
      var dirCallback;
      dirCallback = function(err, directory) {
        var prefix;
        if (err) {
          futureCb(err);
        } else {
          prefix = directory.pack(_this.keyFrag.resolveKey(query));
          transactionalClear(tr || db, prefix, futureCb);
        }
      };
      _this.keyFrag.resolveDirectory(query, dirCallback);
    };
  })(this), callback);
};
