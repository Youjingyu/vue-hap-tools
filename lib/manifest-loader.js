"use strict";

function _interopRequireDefault(e) {
  return e && e.__esModule ? e : {
    default: e
  }
}

function validate(e, t) {
  var r = void 0,
    a = void 0,
    i = validatorMap[e];
  return i && "function" == typeof i.type ? (r = i.type(t), r.reason && (a = {
    reason: r.reason(e, t)
  })) : r = {
    value: !0
  }, {
    value: r.value,
    log: a
  }
}
var _loaderUtils = require("loader-utils"),
  _loaderUtils2 = _interopRequireDefault(_loaderUtils),
  _path = require("path"),
  _path2 = _interopRequireDefault(_path),
  _fs = require("fs"),
  _fs2 = _interopRequireDefault(_fs),
  _utils = require("./utils"),
  REGEXP_INT = /^[-+]?[0-9]+$/,
  REGEXP_URL = /^['"]?([^()]+?)['"]?$/gi,
  REGEXP_NAME = /^[a-zA-Z_][a-zA-Z0-9]*$/,
  validator = {
    integer: function(e) {
      return e = (e || "").toString(), e.match(REGEXP_INT) ? {
        value: !0
      } : {
        value: !1,
        reason: function(e, t) {
          return "ERROR: manifest.json的配置项 `" + e + "` 的值 `" + t + "` 无效(仅支持整数)"
        }
      }
    },
    object: function(e) {
      var t = (0, _utils.isPlainObject)(e);
      return {
        value: (0, _utils.isPlainObject)(e),
        reason: t ? null : function(e, t) {
          return "ERROR: manifest.json的配置项 `" + e + "` 的值 `" + t + "` 无效(仅支持对象)"
        }
      }
    },
    url: function(e) {
      return e = (e || "").toString().trim(), e.match(REGEXP_URL) ? {
        value: !0
      } : {
        value: !1,
        reason: function(e, t) {
          return "ERROR: manifest.json的配置项 `" + e + "` 的值 `" + t + "` 必须是url"
        }
      }
    },
    name: function(e) {
      return e = (e || "").toString(), e.match(REGEXP_NAME) ? {
        value: !0
      } : {
        value: !1,
        reason: function(e, t) {
          return "ERROR: manifest.json的配置项 `" + e + "` 的值 `" + t + "` 格式不正确"
        }
      }
    }
  },
  validatorMap = {
    package: {
      type: validator.string,
      require: !0
    },
    name: {
      type: validator.string,
      require: !0
    },
    versionCode: {
      type: validator.integer,
      require: !0
    },
    icon: {
      type: validator.url,
      require: !0
    },
    config: {
      type: validator.object,
      require: !0
    },
    router: {
      type: validator.object,
      require: !0
    }
  },
  requireAttrMap = [];
! function() {
  Object.keys(validatorMap).forEach(function(e) {
    validatorMap[e].require && requireAttrMap.push(e)
  })
}(), module.exports = function(e) {
  this.cacheable && this.cacheable();
  var t = _loaderUtils2.default.parseQuery(this.query),
    r = t.path,
    a = _path2.default.join(_path2.default.dirname(r), "manifest.json"),
    i = _fs2.default.readFileSync(a),
    n = JSON.parse(i),
    u = [];
  if (n) {
    requireAttrMap.forEach(function(e) {
      n[e] || u.push({
        line: 1,
        column: 1,
        reason: "ERROR: manifest.json缺少配置项 `" + e + "`"
      })
    });
    var o = void 0,
      l = void 0;
    Object.keys(n).forEach(function(e) {
      o = n[e], l = validate(e, o), l.log && u.push({
        line: 1,
        column: 1,
        reason: l.log.reason
      })
    }), (0, _utils.logWarn)(this, u), e += "\n(exports.default || module.exports).manifest = " + JSON.stringify(n) + ";\n", global.framework.manifest = n
  }
  return e
};
