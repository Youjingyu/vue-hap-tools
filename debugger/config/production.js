"use strict";

function _interopRequireDefault(e) {
  return e && e.__esModule ? e : {
    default: e
  }
}

function factory(e) {
  var t = {},
    r = 0,
    a = !0,
    o = !1,
    l = void 0;
  try {
    for (var i, p = e[Symbol.iterator](); !(a = (i = p.next()).done); a = !0) {
      var n = i.value;
      map.hasOwnProperty(n) && (r++, t[n] = map[n])
    }
  } catch (e) {
    o = !0, l = e
  } finally {
    try {
      !a && p.return && p.return()
    } finally {
      if (o) throw l
    }
  }
  try {
    _assert2.default.equal(e.length, r, "### App server ### production env 变量配置与定义不匹配")
  } catch (e) {
    _utils.colorconsole.error("### App Server ### " + e.message)
  }
  return t
}
Object.defineProperty(exports, "__esModule", {
  value: !0
});
var _path = require("path"),
  _path2 = _interopRequireDefault(_path),
  _assert = require("assert"),
  _assert2 = _interopRequireDefault(_assert),
  _utils = require("../lib/utils"),
  deployDirName = "debugger",
  webAppRoot = _path2.default.resolve(__dirname, "..", "client"),
  htmlPagePath = _path2.default.join(webAppRoot, "html"),
  moduleRootPath = _path2.default.resolve(__dirname, "..", ".."),
  cpProjPath = process.cwd(),
  inspectorDeployedDir = _path2.default.join(moduleRootPath, deployDirName, "client", "html"),
  inspectorHtmlDir = _path2.default.join(inspectorDeployedDir, "inspector"),
  inspectorTarBallFile = _path2.default.join(inspectorDeployedDir, "inspector.tar.gz"),
  map = {
    manifestFile: _path2.default.join(cpProjPath, "src", "manifest.json"),
    bundlePath: _path2.default.join(cpProjPath, "qa-dist"),
    clientLogFileDir: _path2.default.join(moduleRootPath, deployDirName, "server", "bundle", "log"),
    inspectorHtmlDir: inspectorHtmlDir,
    inspectorTarBallFile: inspectorTarBallFile,
    WEB_APP_ROOT: webAppRoot,
    HTML_PAGE_PATH: htmlPagePath
  };
exports.default = factory;