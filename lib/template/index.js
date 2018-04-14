"use strict";

function _interopRequireDefault(e) {
  return e && e.__esModule ? e : {
    default: e
  }
}

function calcSubTextNodesNum(e, t) {
  var a = 0;
  if (_validator2.default.isSupportSpan(e)) {
    var r = _validator2.default.getTagChildren(e);
    t.forEach(function(e) {
      ("#text" === e.nodeName && e.value.trim() || r.indexOf(e.nodeName) > -1) && ++a
    })
  }
  return a
}

function traverse(e, t, a, r) {
  _validator2.default.checkTagName(e, t), (e.attrs || []).forEach(function(l) {
    var o = l.name,
      i = o.match(/^:+/);
    i && (o = o.slice(i.length));
    var n = l.value,
      s = {
        line: 1,
        column: 1
      };
    switch (e.__location && (s = {
      line: e.__location.line,
      column: e.__location.col
    }), o) {
      case "id":
        _validator2.default.checkId(n, t), _validator2.default.checkAttr(o, n, t, e.tagName, s);
        break;
      case "class":
        _validator2.default.checkClass(n, t);
        break;
      case "style":
        _validator2.default.checkStyle(n, t, s);
        break;
      case "if":
        e._isroot || _validator2.default.checkIf(n, t, !1, s, r);
        break;
      case "else":
        e._isroot || a && a.__cond__ && _validator2.default.checkElse(a.__cond__, t, s, r);
        break;
      case "elif":
        e._isroot || a && a.__cond__ && (e.__cond__ = _validator2.default.checkElif(n, a.__cond__, t, s, r));
        break;
      case "for":
        e._isroot || _validator2.default.checkFor(n, t, s);
        break;
      case "tree":
        _validator2.default.checkBuild("tree", t);
        break;
      default:
        o.match(/^(on|@)/) ? _validator2.default.checkEvent(o, n, t) : _validator2.default.checkAttr(o, n, t, e.tagName, s)
    }
  });
  var l = t.result,
    o = e.childNodes;
  if (o && o.length) {
    var i = void 0,
      n = [],
      s = calcSubTextNodesNum(l.type, o);
    o.forEach(function(a, r) {
      if (r > 0) {
        var u = o[r - 1];
        u.nodeName.match(/^#/) || (i = u, i.__cond__ || i.attrs && i.attrs.forEach(function(e) {
          "if" !== e.name && "elif" !== e.name || (i.__cond__ = e.value)
        }))
      }
      var d = {};
      if (a.nodeName.match(/^#/)) {
        if ("#text" === a.nodeName && a.value.trim()) {
          if (_validator2.default.isSupportSpan(e.tagName) && s >= 2 && (d.type = "span", t.result = d, l.children = l.children || [], l.children.push(d), _validator2.default.checkAttr("value", a.value, t)), "option" === e.tagName) {
            var _ = t.result;
            return t.result = l, l.attr.hasOwnProperty("value") || _validator2.default.checkAttr("value", a.value, t), _validator2.default.checkAttr("content", a.value, t), void(t.result = _)
          }
          if (_validator2.default.isSupportSpan(e.tagName) && 1 === s || _validator2.default.isTextContentAomtic(e.tagName)) {
            var c = t.result;
            t.result = l, _validator2.default.checkAttr("value", a.value, t), t.result = c
          }
        }
      } else t.result = d, l.children = l.children || [], l.children.push(d), traverse(a, t, i, n)
    }), l.children && 0 === l.children.length && (l.children = void 0)
  }
  t.result = l
}

function initParser(e, t) {
  function a(e, t) {
    e.__preToken && e.__preToken.type === _tokenizer2.default.START_TAG_TOKEN && _validator2.default.isSupportedSelfClosing(e.__preToken.tagName) && !e.__preToken.selfClosing && e.__preToken.tagName !== t.tagName && t.type !== _tokenizer2.default.WHITESPACE_CHARACTER_TOKEN && (_utils.colorconsole.error(e.__preToken.tagName + "标签要闭合,请遵循XML规范"), e.stopped = !0), t.type !== _tokenizer2.default.WHITESPACE_CHARACTER_TOKEN && (e.__preToken = t)
  }
  var r = new _parser2.default(t),
    l = r._appendElement,
    o = r._insertElement;
  return r._insertElement = function(e, t) {
    var a = (e.tagName || "").toLowerCase(),
      r = e.selfClosing,
      i = _validator2.default.isSupportedSelfClosing(a);
    r && !i && _utils.colorconsole.error(a + "标签，禁止使用自闭合"), i || r && a ? l.apply(this, arguments) : o.apply(this, arguments)
  }, r._runParsingLoop = function(e) {
    for (; !this.stopped;) {
      this._setupTokenizerCDATAMode();
      var t = this.tokenizer.getNextToken();
      if (a(this, t), t.type === _tokenizer2.default.HIBERNATION_TOKEN) break;
      if (this.skipNextNewLine && (this.skipNextNewLine = !1, t.type === _tokenizer2.default.WHITESPACE_CHARACTER_TOKEN && "\n" === t.chars[0])) {
        if (1 === t.chars.length) continue;
        t.chars = t.chars.substr(1)
      }
      if (this._processInputToken(t), e && this.pendingScript) break
    }
  }, r.parseFragment(e)
}

function parse(e, t) {
  var a = initParser(e, {
      treeAdapter: _parse2.default.treeAdapters.default,
      locationInfo: !0
    }),
    r = {
      result: {},
      depends: [],
      log: []
    };
  if (!a || !a.childNodes) return r.log.push({
    reason: "ERROR: <template>解析失败",
    line: 1,
    column: 1
  }), void t(null, {
    jsonTemplate: r.result,
    depends: r.depends,
    log: r.log
  });
  var l = a.childNodes.filter(function(e) {
    return "#" !== e.nodeName.charAt(0)
  });
  if (0 === l.length) return r.log.push({
    reason: "ERROR: 没有合法的根节点",
    line: 1,
    column: 1
  }), void t(null, {
    jsonTemplate: r.result,
    depends: r.depends,
    log: r.log
  });
  if (l.length > 1) return r.log.push({
    reason: "ERROR: <template>节点里只能有一个根节点",
    line: 1,
    column: 1
  }), void t(null, {
    jsonTemplate: r.result,
    depends: r.depends,
    log: r.log
  });
  var o = l[0];
  o._isroot = !0, traverse(o, r, null, null), t(null, {
    jsonTemplate: r.result,
    depends: r.depends,
    log: r.log
  })
}
Object.defineProperty(exports, "__esModule", {
  value: !0
});
var _parse = require("parse5"),
  _parse2 = _interopRequireDefault(_parse),
  _parser = require("parse5/lib/parser"),
  _parser2 = _interopRequireDefault(_parser),
  _tokenizer = require("parse5/lib/tokenizer"),
  _tokenizer2 = _interopRequireDefault(_tokenizer),
  _validator = require("./validator"),
  _validator2 = _interopRequireDefault(_validator),
  _utils = require("../utils");
exports.default = {
  parse: parse
};
