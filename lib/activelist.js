(function() {
  var ActiveList,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  module.exports = ActiveList = (function(_super) {
    __extends(ActiveList, _super);

    function ActiveList(recordsOrSize) {
      var record;
      if (recordsOrSize instanceof Array) {
        for (record in recordsOrSize) {
          this.push(record);
        }
      } else {
        ActiveList.__super__.constructor.call(this, recordsOrSize);
      }
    }

    ActiveList.prototype._saveRecord = function(tr, index, callback) {
      var len;
      len = this.length;
      this[index].save(tr, function(err) {
        if (err) {
          callback(err);
        } else if (index === len - 1) {
          callback(null);
        }
      });
    };

    ActiveList.prototype.save = function(tr, callback) {
      var i, _i, _ref;
      for (i = _i = 0, _ref = this.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        this._saveRecord(tr, i, callback);
      }
    };

    return ActiveList;

  })(Array);

}).call(this);
