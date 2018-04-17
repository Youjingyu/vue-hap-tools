"use strict";

function _interopRequireDefault(e) {
  return e && e.__esModule ? e : {
    default: e
  }
}

function makeLoaderString(e, a) {
  a = a || {};
  var r = void 0;
  return "component" === e ? (r = [{
    name: defaultLoaders.component,
    query: {
      type: "component"
    }
  }], (0, _utils.stringifyLoaders)(r)) : "template" === e ? (r = [{
    name: defaultLoaders.json
  }, {
    name: defaultLoaders.template
  }], a.source || r.push({
    name: defaultLoaders.fragment,
    query: {
      index: 0,
      type: "templates"
    }
  }), (0, _utils.stringifyLoaders)(r)) : "style" === e ? (r = [{
    name: defaultLoaders.json
  }, {
    name: defaultLoaders.style,
    query: {
      index: 0,
      type: "styles"
    }
  }], a.lang && r.push({
    name: a.lang + "-loader"
  }), a.source || r.push({
    name: defaultLoaders.fragment,
    query: {
      index: 0,
      type: "styles"
    }
  }), (0, _utils.stringifyLoaders)(r)) : "script" === e ? (r = [{
    name: defaultLoaders.script
  }, {
    name: defaultLoaders.babel,
    query: {
      presets: [(0, _utils.loadBabelModule)("babel-preset-env")],
      plugins: [_path2.default.resolve(__dirname, "jsx-loader.js")],
      comments: "false"
    }
  }, {
    name: defaultLoaders.access
  }], a.source || r.push({
    name: defaultLoaders.fragment,
    query: {
      index: 0,
      type: "scripts"
    }
  }), (0, _utils.stringifyLoaders)(r)) : void 0
}

function loader(e, a, r) {
  var t = e;
  t.cacheable && t.cacheable();
  var s = _loaderUtils2.default.parseQuery(t.resourceQuery),
    l = t.resourcePath,
    o = (_path2.default.relative(".", l), !r || "component" !== r.type),
    n = s.name || (0, _utils.getNameByPath)(l);
  _validator2.default.isReservedTag(n) && t.emitError("脚本文件名不能使用保留字:" + n), (0, _utils.print)({
    loaderQuery: r,
    resourceQuery: t.resourceQuery,
    resourcePath: t.resourcePath,
    name: n
  });

  // 转换vue文件
  const convert = require('../convert');
  var p = "",
    i = (0, _parser.parseFragment)(convert(a, {convertAll: true}));
    // i = (0, _parser.parseFragment)(a);    
  (0, _utils.print)(i);
  var u = [];
  if (i.import.length)
    for (var d = 0; d < i.import.length; d++) {
      var m = i.import[d];
      if (!m.src) return t.emitError("导入组件需要设置属性 `src` "), "";
      m.name || (m.name = (0, _utils.getNameByPath)(m.src)), m.name = m.name.toLowerCase(), _validator2.default.isReservedTag(m.name) && t.emitError("导入组件的属性 `name` 不能使用保留字: " + m.name), u.push(m.name);
      var _ = m.src;
      (0, _utils.print)({
        name: m.name,
        src: m.src,
        rsrc: _
      });
      var c = (0, _utils.makeRequireString)(t, makeLoaderString("component", {
        source: m.src
      }), _ + "?name=" + m.name);
      p += c
    }
  if (i.depends.length) {
    var f = {},
      h = !0,
      y = !1,
      g = void 0;
    try {
      for (var v, $ = i.depends[Symbol.iterator](); !(h = (v = $.next()).done); h = !0) {
        var q = v.value,
          L = _path2.default.resolve(_path2.default.dirname(l), "" + q);
        f[q] = L, u.indexOf(q) < 0 && _fs2.default.existsSync(L) && (p += (0, _utils.makeRequireString)(t, makeLoaderString("none"), "./" + q))
      }
    } catch (e) {
      y = !0, g = e
    } finally {
      try {
        !h && $.return && $.return()
      } finally {
        if (y) throw g
      }
    }(0, _utils.print)(f)
  }
  if (!i.template.length) return t.emitError("需要模板片段"), "";
  var x = i.template[0],
    k = l;
  if (x.src && (k = x.src), p += "var $app_template$ = " + (0, _utils.makeRequireString)(t, makeLoaderString("template", {
      source: x.src
    }), k), i.style.length) {
    var S = i.style[0],
      b = l;
    S.src && (b = S.src), p += "var $app_style$ = " + (0, _utils.makeRequireString)(t, makeLoaderString("style", {
      source: S.src,
      lang: S.lang
    }), b), (0, _utils.print)({
      style: b
    })
  }
  if (i.script.length) {
    var j = i.script[0],
      P = l;
    j.src && (P = j.src), p += "var $app_script$ = " + (0, _utils.makeRequireString)(t, makeLoaderString("script", {
      source: j.src
    }), P + "?isEntry=" + o)
  }
  if (p += "\n$app_define$('@app-component/" + n + "', [], function($app_require$, $app_exports$, $app_module$){\n", i.script.length > 0 && (p += "     $app_script$($app_module$, $app_exports$, $app_require$)\n", p += "     if ($app_exports$.__esModule && $app_exports$.default) {\n            $app_module$.exports = $app_exports$.default\n        }\n"), p += "     $app_module$.exports.template = $app_template$\n", i.style.length > 0 && (p += "     $app_module$.exports.style = $app_style$\n"), p += "})\n", o) {
    p += "\n$app_bootstrap$('@app-component/" + n + "',{ packagerVersion: '" + JSON.parse(_fs2.default.readFileSync(packagepath).toString()).subversion.packager + "'})\n"
  }

  // return p
  // 在所有loader之前添加转换loader
  const vue2Hap = require('../convert/vue2hap-loader');
  return vue2Hap(p)
}
var _loaderUtils = require("loader-utils"),
  _loaderUtils2 = _interopRequireDefault(_loaderUtils),
  _path = require("path"),
  _path2 = _interopRequireDefault(_path),
  _fs = require("fs"),
  _fs2 = _interopRequireDefault(_fs),
  _md = require("md5"),
  _md2 = _interopRequireDefault(_md),
  _parser = require("./parser"),
  _utils = require("./utils"),
  _validator = require("./template/validator"),
  _validator2 = _interopRequireDefault(_validator),
  loaderPath = __dirname,
  packagepath = _path2.default.resolve(loaderPath, "../package.json"),
  defaultLoaders = {
    none: "",
    component: _path2.default.resolve(loaderPath, "loader.js"),
    fragment: _path2.default.resolve(loaderPath, "fragment-loader.js"),
    template: _path2.default.resolve(loaderPath, "template-loader.js"),
    style: _path2.default.resolve(loaderPath, "style-loader.js"),
    script: _path2.default.resolve(loaderPath, "script-loader.js"),
    access: _path2.default.resolve(loaderPath, "access-loader.js"),
    json: _path2.default.resolve(loaderPath, "json-loader.js"),
    babel: "babel-loader"
  };
module.exports = loader;
