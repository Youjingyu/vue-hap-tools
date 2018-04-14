"use strict";

function _interopRequireWildcard(e) {
  if (e && e.__esModule) return e;
  var r = {};
  if (null != e)
    for (var a in e) Object.prototype.hasOwnProperty.call(e, a) && (r[a] = e[a]);
  return r.default = e, r
}

function _interopRequireDefault(e) {
  return e && e.__esModule ? e : {
    default: e
  }
}

function loader(e) {
  this.cacheable && this.cacheable();
  var r = _loaderUtils2.default.parseQuery(this.query),
    a = this.resourcePath,
    t = _path2.default.parse(a),
    i = t.name,
    o = t.ext;
  return -1 !== info.name.scriptList.indexOf(o) ? "app" === i ? (0, _appLoader2.default)(this, e) : (0, _pageLoader2.default)(this, e, r) : (this.emitError("未知文件格式：" + o), e)
}
var _path = require("path"),
  _path2 = _interopRequireDefault(_path),
  _loaderUtils = require("loader-utils"),
  _loaderUtils2 = _interopRequireDefault(_loaderUtils),
  _pageLoader = require("./page-loader"),
  _pageLoader2 = _interopRequireDefault(_pageLoader),
  _appLoader = require("./app-loader"),
  _appLoader2 = _interopRequireDefault(_appLoader),
  _info = require("./info"),
  info = _interopRequireWildcard(_info);
module.exports = loader;
