"use strict";

function _interopRequireDefault(e) {
  return e && e.__esModule ? e : {
    default: e
  }
}

function _toConsumableArray(e) {
  if (Array.isArray(e)) {
    for (var r = 0, t = Array(e.length); r < e.length; r++) t[r] = e[r];
    return t
  }
  return Array.from(e)
}

function extend(e) {
  for (var r = arguments.length, t = Array(r > 1 ? r - 1 : 0), n = 1; n < r; n++) t[n - 1] = arguments[n];
  if ("function" == typeof Object.assign) Object.assign.apply(Object, [e].concat(t));
  else {
    var o = t.shift();
    for (var a in o) e[a] = o[a];
    t.length && extend.apply(void 0, [e].concat(t))
  }
  return e
}

function merge(e) {
  for (var r = arguments.length, t = Array(r > 1 ? r - 1 : 0), n = 1; n < r; n++) t[n - 1] = arguments[n];
  return t.length && t.forEach(function(r) {
    e = e.concat(r)
  }), e
}

function hyphenedToCamelCase(e) {
  return e.replace(/-([a-z])/g, function(e, r) {
    return r.toUpperCase()
  })
}

function camelCaseToHyphened(e) {
  return e.replace(/([A-Z])/g, function(e, r) {
    return "-" + r.toLowerCase()
  })
}

function getNameByPath(e) {
  return _path2.default.basename(e).replace(/\..*$/, "")
}

function getFileNameWithHash(e, r) {
  var t = _path2.default.relative(".", e);
  return "./" + t + "?" + (0, _hashSum2.default)(t + r)
}

function isEmptyObject(e) {
  if (!e) return !0;
  for (var r in e) return !1;
  return !0
}

function isPlainObject(e) {
  return toString.call(e) === OBJECT_STRING
}

function loadBabelModule(e) {
  var r = _path2.default.resolve(__dirname, "..", "node_modules", e),
    t = _path2.default.resolve(process.cwd(), "node_modules", e);
  return _fs2.default.existsSync(r) ? r : _fs2.default.existsSync(t) ? t : e
}

function getFilenameByPath(e) {
  return _path2.default.relative(".", e)
}

function stringifyFunction(e, r) {
  return "function" == typeof r ? FUNC_START + r.toString() + FUNC_END : r
}

function logWarn(e, r) {
  r && r.length && r.forEach(function(r) {
    var t = r.line && r.column ? "\t@" + r.line + ":" + r.column : "";
    r.reason.startsWith("ERROR") ? e.emitError(r.reason + t) : e.emitWarning(r.reason + t)
  })
}

function makeRequireString(e, r, t) {
  return print({
    loader: r,
    filepath: t
  }), "require(" + _loaderUtils2.default.stringifyRequest(e, r ? "!!" + r + "!" + t : "" + t) + ")\n"
}

function stringifyLoaders(e) {
  return e.map(function(e) {
    if ("string" == typeof e) return e;
    var r = e.name,
      t = [];
    if (e.query)
      for (var n in e.query) {
        var o = e.query[n];
        null != o && (!0 === o ? t.push(n) : (o instanceof Array && t.push(n + "[]=" + o.join(",")), t.push(n + "=" + o)))
      }
    return r + (t.length ? "?" + t.join("&") : "")
  }).join("!")
}

function generateMap(e, r, t) {
  var n = e.resourcePath,
    o = getFileNameWithHash(n),
    a = _path2.default.resolve("."),
    i = new _sourceMap.SourceMapGenerator({
      sourceRoot: a,
      skipValidation: !0
    });
  i.setSourceContent(o, r);
  var l = !0,
    u = !1,
    s = void 0;
  try {
    for (var c, p = t[Symbol.iterator](); !(l = (c = p.next()).done); l = !0) {
      var f = c.value,
        h = f.original,
        d = f.generated;
      i.addMapping({
        source: o,
        original: h,
        generated: d
      })
    }
  } catch (e) {
    u = !0, s = e
  } finally {
    try {
      !l && p.return && p.return()
    } finally {
      if (u) throw s
    }
  }
  return i
}

function consumeMap(e, r, t) {
  var n = new _sourceMap.SourceMapConsumer(t),
    o = void 0,
    a = [],
    i = [],
    l = {};
  return splitSourceLine(r).forEach(function(e, r) {
    r += 1;
    var t = n.originalPositionFor({
      line: r,
      column: 0
    });
    t.source && (o = t.source, a.push({
      line: t.line,
      column: t.column
    }), i.push({
      line: r,
      column: 0
    }), l["line-" + r + "-column-0"] = {
      line: t.line,
      column: t.column
    })
  }), {
    source: o,
    original: a,
    generated: i,
    mapping: l,
    sourcesContent: n.sourcesContent
  }
}

function mkdirsSync(e) {
  return !!_fs2.default.existsSync(e) || (mkdirsSync(_path2.default.dirname(e)) ? (_fs2.default.mkdirSync(e), !0) : void 0)
}

function splitSourceLine(e) {
  return e.split(REGEXP_LINE)
}

function print(e) {
  if (showLog) {
    var r = "";
    if ("string" == typeof e) r = "######### " + e + " #########";
    else
      for (var t in e) r += "######### " + t + " : " + e[t] + " #########\n";
    console.log(r)
  }
}

function splitAttr(e, r) {
  var t = [];
  if (r) switch (e.forEach(function(e, r) {
    t[r] = {}, t[r].n = e
  }), r.length) {
    case 1:
      e.forEach(function(e, n) {
        t[n].v = r[0]
      });
      break;
    case 2:
      e.forEach(function(e, n) {
        t[n].v = n % 2 ? r[1] : r[0]
      });
      break;
    case 3:
      e.forEach(function(e, n) {
        t[n].v = n % 2 ? r[1] : r[n]
      });
      break;
    default:
      e.forEach(function(e, n) {
        t[n].v = r[n]
      })
  }
  return t
}

function isValidValue(e) {
  return "number" == typeof e || "string" == typeof e
}

function prependLevel(e, r) {
  !logLevelMap[e] && function(r) {
    var t = r.toUpperCase().substr(0, 4);
    t.paddEnd && t.paddEnd(4), logLevelMap[e] = t
  }(e), "string" == typeof r[0] && r[0].length > 1 && "[" !== r[0][0] && (r[0] = "[" + logLevelMap[e] + "] " + r[0])
}

function equals(e, r, t) {
  if (t) {
    for (var n = arguments.length, o = Array(n > 3 ? n - 3 : 0), a = 3; a < n; a++) o[a - 3] = arguments[a];
    if (t.apply(void 0, [e, r].concat(o))) return !0
  }
  var i = Object.prototype.toString.call(e);
  if (i !== Object.prototype.toString.call(r)) return !1;
  if ("[object Null]" === i || "[object Undefined]" === i) return !0;
  if ("[object Object]" !== i && "[object Array]" !== i) return Object(e).toString() === Object(r).toString();
  var l = {};
  Object.keys(e).forEach(function(e) {
    return l[e] = !0
  }), Object.keys(r).forEach(function(e) {
    return l[e] = !0
  });
  for (var u = Object.keys(l), s = 0; s < u.length; s++) {
    var c = u[s];
    if (!equals(e[c], r[c], t, c)) return !1
  }
  return !0
}
Object.defineProperty(exports, "__esModule", {
  value: !0
}), exports.colorconsole = exports.FUNC_END_REG = exports.FUNC_END = exports.FUNC_START_REG = exports.FUNC_START = void 0, exports.extend = extend, exports.merge = merge, exports.hyphenedToCamelCase = hyphenedToCamelCase, exports.camelCaseToHyphened = camelCaseToHyphened, exports.getNameByPath = getNameByPath, exports.getFileNameWithHash = getFileNameWithHash, exports.isEmptyObject = isEmptyObject, exports.isPlainObject = isPlainObject, exports.loadBabelModule = loadBabelModule, exports.getFilenameByPath = getFilenameByPath, exports.stringifyFunction = stringifyFunction, exports.logWarn = logWarn, exports.makeRequireString = makeRequireString, exports.stringifyLoaders = stringifyLoaders, exports.generateMap = generateMap, exports.consumeMap = consumeMap, exports.mkdirsSync = mkdirsSync, exports.splitSourceLine = splitSourceLine, exports.print = print, exports.splitAttr = splitAttr, exports.isValidValue = isValidValue, exports.equals = equals;
var _path = require("path"),
  _path2 = _interopRequireDefault(_path),
  _loaderUtils = require("loader-utils"),
  _loaderUtils2 = _interopRequireDefault(_loaderUtils),
  _hashSum = require("hash-sum"),
  _hashSum2 = _interopRequireDefault(_hashSum),
  _fs = require("fs"),
  _fs2 = _interopRequireDefault(_fs),
  _sourceMap = require("source-map"),
  _chalk = require("chalk"),
  _chalk2 = _interopRequireDefault(_chalk),
  toString = Object.prototype.toString,
  OBJECT_STRING = "[object Object]",
  FUNC_START = exports.FUNC_START = "#####FUNC_START#####",
  FUNC_START_REG = exports.FUNC_START_REG = new RegExp("[\"']" + FUNC_START, "g"),
  FUNC_END = exports.FUNC_END = "#####FUNC_END#####",
  FUNC_END_REG = exports.FUNC_END_REG = new RegExp(FUNC_END + "[\"']", "g"),
  REGEXP_LINE = /\r?\n/g,
  showLog = !1,
  logLevelMap = {},
  colorconsole = exports.colorconsole = {
    trace: function() {
      for (var e, r = arguments.length, t = Array(r), n = 0; n < r; n++) t[n] = arguments[n];
      prependLevel("trace", t), (e = console).trace.apply(e, _toConsumableArray(t))
    },
    log: function() {
      for (var e = arguments.length, r = Array(e), t = 0; t < e; t++) r[t] = arguments[t];
      prependLevel("log", r), console.log(_chalk2.default.green.apply(_chalk2.default, _toConsumableArray(r)))
    },
    info: function() {
      for (var e = arguments.length, r = Array(e), t = 0; t < e; t++) r[t] = arguments[t];
      prependLevel("info", r), console.info(_chalk2.default.green.apply(_chalk2.default, _toConsumableArray(r)))
    },
    warn: function() {
      for (var e, r = arguments.length, t = Array(r), n = 0; n < r; n++) t[n] = arguments[n];
      prependLevel("warn", t), console.warn((e = _chalk2.default.yellow).bold.apply(e, _toConsumableArray(t)))
    },
    error: function() {
      for (var e, r = arguments.length, t = Array(r), n = 0; n < r; n++) t[n] = arguments[n];
      prependLevel("error", t), console.error((e = _chalk2.default.red).bold.apply(e, _toConsumableArray(t)))
    },
    throw: function() {
      var e;
      throw new Error((e = _chalk2.default.red).bold.apply(e, arguments))
    }
  };
