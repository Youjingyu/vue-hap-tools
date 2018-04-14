"use strict";

function _interopRequireDefault(e) {
  return e && e.__esModule ? e : {
    default: e
  }
}
var _loaderUtils = require("loader-utils"),
  _loaderUtils2 = _interopRequireDefault(_loaderUtils),
  _utils = require("./utils"),
  _parser = require("./parser");
module.exports = function(e) {
  var r = this;
  this.cacheable && this.cacheable();
  var t = this.async(),
    l = _loaderUtils2.default.parseQuery(this.query);
  (0, _parser.parseStyle)({
    code: e,
    query: l,
    loader: this
  }).then(function(e) {
    var l = e.parsed,
      a = e.log;
    a && a.length && (0, _utils.logWarn)(r, a), t(null, l)
  }).catch(function(e) {
    t(e, "")
  })
};
