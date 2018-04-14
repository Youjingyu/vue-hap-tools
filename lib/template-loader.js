"use strict";
var _utils = require("./utils"),
  _parser = require("./parser");
module.exports = function(e) {
  var r = this;
  this.cacheable && this.cacheable();
  var a = this.async();
  (0, _parser.parseTemplate)(e).then(function(e) {
    var t = e.parsed,
      s = e.log;
    s && s.length && (0, _utils.logWarn)(r, s), a(null, t)
  }).catch(function(e) {
    a(e, "")
  })
};
