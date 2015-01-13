(function() {
  var ID,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  module.exports = ID = (function(_super) {
    __extends(ID, _super);

    function ID(hexStr) {
      ID.__super__.constructor.call(this, hexStr, 'hex');
    }

    ID.prototype.toString = function() {
      return ID.__super__.toString.call(this, 'hex');
    };

    ID.prototype.toJSON = function() {
      return this.toString();
    };

    return ID;

  })(Buffer);

}).call(this);
