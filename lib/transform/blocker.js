"use strict";

function _interopRequireDefault(e) {
  return e && e.__esModule ? e : {
    default: e
  }
}

function parse(e, t) {
  var a = _parse2.default.parseFragment(e, {
      treeAdapter: _parse2.default.treeAdapters.default,
      locationInfo: !0
    }),
    s = [];
  a.childNodes.forEach(function(t) {
    var a = void 0,
      r = void 0,
      n = void 0,
      o = void 0;
    if (t.__location) {
      var l = t.__location;
      l.startTag && l.endTag ? (a = l.startTag.endOffset || 0, r = l.endTag.startOffset || 0) : (a = l.startOffset || 0, r = l.endOffset || 0), n = l.line, o = l.col
    } else a = r = n = o = 0;
    var i = {
      type: t.nodeName,
      location: {
        start: a,
        end: r,
        line: n,
        column: o
      },
      content: e.substring(a, r),
      attrs: {}
    };
    t.attrs && t.attrs.length && t.attrs.forEach(function(e) {
      i.attrs[e.name] = e.value
    }), s.push(i)
  }), t(null, s)
}

function format(e, t) {
  var a = {};
  parse(e, function(e, s) {
    e && console.error(e.stack), s.forEach(function(e) {
      switch (e.type) {
        case "template":
          a.templates || (a.templates = []), a.templates.push(e);
          break;
        case "style":
          a.styles || (a.styles = []), a.styles.push(e);
          break;
        case "script":
          a.scripts || (a.scripts = []), a.scripts.push(e)
      }
    }), t(null, a)
  })
}
var _parse = require("parse5"),
  _parse2 = _interopRequireDefault(_parse);
module.exports = {
  parse: parse,
  format: format
};
