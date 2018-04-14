"use strict";

function _interopRequireDefault(e) {
  return e && e.__esModule ? e : {
    default: e
  }
}

function makeLoaderString(e, a) {
  a = a || {};
  var r = void 0;
  if ("script" === e) return r = [{
    name: defaultLoaders.script
  }, {
    name: defaultLoaders.mainfest,
    query: {
      path: a.path
    }
  }, {
    name: defaultLoaders.babel,
    query: {
      presets: [(0, _utils.loadBabelModule)("babel-preset-env")],
      plugins: [(0, _utils.loadBabelModule)("babel-plugin-transform-runtime")],
      comments: "false"
    }
  }], a.source || r.push({
    name: defaultLoaders.fragment,
    query: {
      index: 0,
      type: "scripts"
    }
  }), (0, _utils.stringifyLoaders)(r)
}

function loader(e, a, r) {
  var t = e;
  t.cacheable && t.cacheable();
  var p = _loaderUtils2.default.parseQuery(t.resourceQuery),
    s = t.resourcePath,
    l = (_path2.default.relative(".", s), !r || "component" !== r.type),
    u = p.name || (0, _utils.getNameByPath)(s);
  (0, _utils.print)({
    loaderQuery: null,
    resourceQuery: t.resourceQuery,
    resourcePath: t.resourcePath,
    name: u
  });
  var o = "",
    i = (0, _parser.parseFragment)(a);
  if ((0, _utils.print)(i), i.script.length) {
    var n = i.script[0],
      d = s;
    n.src && (d = n.src), o += "var $app_script$ = " + (0, _utils.makeRequireString)(t, makeLoaderString("script", {
      source: n.src,
      path: s
    }), d + "?isEntry=" + l)
  }
  return o += "\n$app_define$('@app-application/" + u + "', [], function($app_require$, $app_exports$, $app_module$){\n", i.script.length > 0 && (o += "     $app_script$($app_module$, $app_exports$, $app_require$)\n", o += "     if ($app_exports$.__esModule && $app_exports$.default) {\n            $app_module$.exports = $app_exports$.default\n        }\n"), o += "})\n", o += "\n$app_bootstrap$('@app-application/" + u + "',{ packagerVersion: '" + JSON.parse(_fs2.default.readFileSync(packagepath).toString()).subversion.packager + "'})\n"
}
var _loaderUtils = require("loader-utils"),
  _loaderUtils2 = _interopRequireDefault(_loaderUtils),
  _path = require("path"),
  _path2 = _interopRequireDefault(_path),
  _md = require("md5"),
  _md2 = _interopRequireDefault(_md),
  _fs = require("fs"),
  _fs2 = _interopRequireDefault(_fs),
  _parser = require("./parser"),
  _utils = require("./utils"),
  loaderPath = __dirname,
  packagepath = _path2.default.resolve(loaderPath, "../package.json"),
  defaultLoaders = {
    component: _path2.default.resolve(loaderPath, "loader.js"),
    fragment: _path2.default.resolve(loaderPath, "fragment-loader.js"),
    script: _path2.default.resolve(loaderPath, "script-loader.js"),
    babel: "babel-loader",
    mainfest: _path2.default.resolve(loaderPath, "manifest-loader.js")
  };
module.exports = loader;
