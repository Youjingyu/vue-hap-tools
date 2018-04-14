"use strict";

function _interopRequireDefault(e) {
  return e && e.__esModule ? e : {
    default: e
  }
}

function getAttribute(e, t) {
  if (e.attrs)
    for (var r = e.attrs.length, a = void 0; r--;)
      if (a = e.attrs[r], a.name === t) return a.value
}

function extractDependencies(e, t) {
  e.childNodes && e.childNodes.forEach(function(e) {
    _validator2.default.checkTagName(e, {
      result: {},
      depends: t,
      log: []
    }), extractDependencies(e, t)
  })
}

function parseFragment(e) {
  var t = _parse2.default.parseFragment(e, {
      treeAdapter: _parse2.default.treeAdapters.default,
      locationInfo: !0
    }),
    r = {
      depends: [],
      import: [],
      template: [],
      style: [],
      script: [],
      data: [],
      config: []
    };
  return t.childNodes.forEach(function(e) {
    var t = void 0;
    if ((0, _utils.print)("parsing tag: " + e.tagName), "script" === e.tagName ? "data" !== (t = getAttribute(e, "type")) && (t = "script") : t = e.tagName, r[t]) {
      var a = getAttribute(e, "name"),
        i = getAttribute(e, "src"),
        n = getAttribute(e, "lang");
      if (r[t].push({
          name: a,
          src: i,
          lang: n,
          node: e
        }), "template" === t) {
        var s = [];
        extractDependencies(e.content, s), r.depends = s
      }
    }
  }), r
}

function extractBlocks(e, t) {
  return new Promise(function(r, a) {
    _transform2.default.format(e, function(e, i) {
      e ? a(e) : r(i[t])
    })
  })
}

function parseTemplate(e) {
  return new Promise(function(t, r) {
    _template2.default.parse(e, function(e, a) {
      if (e) r(e);
      else {
        var i = JSON.stringify(a.jsonTemplate, _utils.stringifyFunction, "  ");
        i = i.replace(_utils.FUNC_START_REG, "").replace(_utils.FUNC_END_REG, ""), t({
          parsed: i,
          log: a.log
        })
      }
    })
  })
}

function parseStyle(e) {
  return new Promise(function(t, r) {
    _style2.default.parse(e, function(e, a) {
      if (e) r(e);
      else {
        var i = JSON.stringify(a.jsonStyle, null, 2);
        t({
          parsed: i,
          log: a.log
        })
      }
    })
  })
}

function parseScript(e) {
  return new Promise(function(t, r) {
    t({
      parsed: _script2.default.fix(e)
    })
  })
}
Object.defineProperty(exports, "__esModule", {
  value: !0
}), exports.parseFragment = parseFragment, exports.extractBlocks = extractBlocks, exports.parseTemplate = parseTemplate, exports.parseStyle = parseStyle, exports.parseScript = parseScript;
var _parse = require("parse5"),
  _parse2 = _interopRequireDefault(_parse),
  _transform = require("./transform"),
  _transform2 = _interopRequireDefault(_transform),
  _template = require("./template"),
  _template2 = _interopRequireDefault(_template),
  _style = require("./style"),
  _style2 = _interopRequireDefault(_style),
  _script = require("./script"),
  _script2 = _interopRequireDefault(_script),
  _validator = require("./template/validator"),
  _validator2 = _interopRequireDefault(_validator),
  _utils = require("./utils");
