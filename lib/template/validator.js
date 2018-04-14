"use strict";

function _interopRequireWildcard(e) {
  if (e && e.__esModule) return e;
  var t = {};
  if (null != e)
    for (var a in e) Object.prototype.hasOwnProperty.call(e, a) && (t[a] = e[a]);
  return t.default = e, t
}

function _interopRequireDefault(e) {
  return e && e.__esModule ? e : {
    default: e
  }
}

function checkTagName(e, t) {
  var a = t.result,
    n = t.depends,
    s = t.log,
    i = e.tagName,
    r = e.childNodes || [],
    l = e.__location || {};
  tagAliasMap[i] && ("img" !== i && s.push({
    line: l.line || 1,
    column: l.col || 1,
    reason: "NOTE: 组件名 `" + i + "` 自动转换为 `" + tagAliasMap[i] + "`"
  }), i = tagAliasMap[i]), a.type = i, RESERVED_TAGS.indexOf(i) >= 0 && s.push({
    line: l.line || 1,
    column: l.col || 1,
    reason: "ERROR: 组件名 `" + i + "` 非法, 请修改"
  }), e._isroot && tagNotRoot.indexOf(i) >= 0 && s.push({
    line: l.line || 1,
    column: l.col || 1,
    reason: "ERROR: 组件 `" + i + "` 不能作为根组件"
  }), n.indexOf(i) < 0 && "string" == typeof i && !tagNatives[i] && n.push(i), tagAtomics.indexOf(i) >= 0 && (tagTextCotent.indexOf(i) < 0 ? r.length > 0 && r.every(function(e) {
    return "#text" === e.nodeName || (s.push({
      line: l.line || 1,
      column: l.col || 1,
      reason: "ERROR: 组件 `" + i + "` 是原子类型，不应该有子节点"
    }), !1)
  }) : (r.length > 1 || r[0] && "#text" !== r[0].nodeName) && s.push({
    line: l.line || 1,
    column: l.col || 1,
    reason: "ERROR: 组件 `" + i + "` 只能有一个文字子节点"
  })), a.attr = a.attr || {};
  var o = e.attrs || [],
    u = [];
  if (o.forEach(function(e) {
      u.push(e.name.toLowerCase())
    }), tagDefaultAttrMap[i] && Object.keys(tagDefaultAttrMap[i]).forEach(function(e) {
      var t = u.indexOf(e);
      t >= 0 && "" === o[t].value && (o[t].value = tagDefaultAttrMap[i][e], s.push({
        line: l.line || 1,
        column: l.col || 1,
        reason: "ERROR: 组件 `" + i + "` 属性 `" + e + "` 值为空, 默认设置为缺省值 `" + tagDefaultAttrMap[i][e] + "`"
      }))
    }), e._isroot) {
    var c = ["for", "if", "elif", "else", "show"];
    u.forEach(function(e) {
      c.indexOf(e) >= 0 && s.push({
        line: l.line || 1,
        column: l.col || 1,
        reason: "ERROR: 根节点 `" + i + "` 不能使用属性 `" + e + "`"
      })
    })
  }
  if (tagRequireAttrMap[i] && tagRequireAttrMap[i].forEach(function(e) {
      u.indexOf(e) < 0 && s.push({
        line: l.line || 1,
        column: l.col || 1,
        reason: "ERROR: 组件 `" + i + "` 没有定义属性 `" + e + "`"
      })
    }), tagEnumAttrMap[i] && Object.keys(tagEnumAttrMap[i]).forEach(function(e) {
      var t = u.indexOf(e);
      if (t >= 0) {
        var a = o[t].value;
        if (!_exp2.default.isExpr(a)) {
          var n = tagEnumAttrMap[i][e];
          n.indexOf(a) < 0 && (o[t].value = n[0], s.push({
            line: l.line || 1,
            column: l.col || 1,
            reason: "ERROR: 组件 `" + i + "` 属性 `" + e + "` 的值 `" + a + "`非法, 默认设置为缺省值 `" + n[0] + "`"
          }))
        }
      }
    }), tagAttrMap[i] && u.forEach(function(e) {
      e.match(/^(on|@)/) || e in tagAttrMap[i] || s.push({
        line: l.line || 1,
        column: l.col || 1,
        reason: "ERROR: 组件 `" + i + "` 不支持属性 `" + e + "`，支持的属性有 [" + Object.keys(tagAttrMap[i]).join(", ") + "]"
      })
    }), tagEventsMap[i]) {
    var p = tagEventsMap[i];
    u.forEach(function(e) {
      if (e.match(/^(on|@)/)) {
        var t = e.replace(/^(on|@)/, "");
        p.indexOf(t.toLowerCase()) < 0 && s.push({
          line: l.line || 1,
          column: l.col || 1,
          reason: "ERROR: 组件 `" + i + "` 不支持事件 `" + t + "`"
        })
      }
    })
  }
  r.length > 0 && r.forEach(function(e) {
    if (isReservedTag(i) && isReservedTag(e.nodeName)) {
      var t = tagParentsMap[e.nodeName],
        a = tagChildrenMap[i];
      (t && t.indexOf(i) < 0 || a && a.indexOf(e.nodeName) < 0) && s.push({
        line: l.line || 1,
        column: l.col || 1,
        reason: "ERROR: 组件 `" + i + "` 不支持子组件 `" + e.nodeName + "`"
      })
    }
  })
}

function checkId(e, t) {
  e && (t.result.id = _exp2.default.isExpr(e) ? (0, _exp2.default)(e) : e)
}

function checkBuild(e, t) {
  e && (t.result.append = "tree" === e ? "tree" : "single")
}

function checkClass(className, output) {
  var hasBinding = void 0,
    tempClassList = void 0,
    classList = [],
    tempCode = void 0;
  if (className = className.trim()) {
    tempClassList = className.split(" ");
    var expStart = -1,
      expEnd = -1;
    tempClassList.forEach(function(e, t) {
      e.indexOf("{{") > -1 && -1 === e.indexOf("}}") ? expStart = t : -1 !== expStart && e.indexOf("}}") > -1 ? (expEnd = t, classList.push(tempClassList.slice(expStart, expEnd + 1).join("")), expStart = -1, expEnd = -1) : (-1 === expStart && -1 === expEnd || e.indexOf("{{") > -1 && e.indexOf("}}") > -1) && classList.push(e)
    }), classList = classList.map(function(e) {
      return _exp2.default.isExpr(e) ? (hasBinding = !0, (0, _exp2.default)(e, !1)) : "'" + e + "'"
    }), hasBinding ? (tempCode = "(function () {return [" + classList.join(", ") + "]})", output.result.classList = eval(tempCode)) : output.result.classList = classList.map(function(e) {
      return e.substr(1, e.length - 2)
    })
  }
}

function checkStyle(e, t, a) {
  var n = {},
    s = t.log;
  if (e) {
    if (_exp2.default.singleExpr(e)) {
      var i = _exp2.default.removeExprffix(e);
      return _exp2.default.isExpr(i) ? s.push({
        line: a.line || 1,
        column: a.col || 1,
        reason: "ERROR: style 属性不能嵌套多层{{}}"
      }) : n = (0, _exp2.default)(e), void(t.result.style = n)
    }
    e.split(";").forEach(function(e) {
      var t = void 0,
        i = void 0,
        r = void 0,
        l = e.trim().split(":");
      l.length > 2 && (l[1] = l.slice(1).join(":"), l = l.slice(0, 2)), 2 === l.length && (t = l[0].trim(), t = (0, _utils.hyphenedToCamelCase)(t), i = l[1].trim(), i = (0, _exp2.default)(i), r = _style2.default.validateDelaration(t, i), i = r.value, i.forEach(function(e) {
        ((0, _utils.isValidValue)(e.v) || "function" == typeof e.v) && (n[e.n] = e.v)
      }), r.log && s.push({
        line: a.line || 1,
        column: a.col || 1,
        reason: r.log.reason
      }))
    }), t.result.style = n
  }
}

function checkIf(e, t, a, n, s) {
  var i = t.log;
  e ? (e = _exp2.default.addExprffix(e), a ? e = "{{" + buildConditionExp(s) + "}}" : (s.length > 0 && (s.length = 0), s.push("" + e.substr(2, e.length - 4))), t.result.shown = (0, _exp2.default)(e)) : a || i.push({
    line: n.line || 1,
    column: n.col || 1,
    reason: "WARNING: if 属性为空"
  })
}

function checkElse(e, t, a, n) {
  checkIf(e, t, !0, a, n), n.length = 0
}

function checkElif(e, t, a, n, s) {
  var i = a.log,
    r = t;
  return e ? (e = _exp2.default.addExprffix(e), t = _exp2.default.addExprffix(t), r = "{{(" + e.substr(2, e.length - 4) + ") && " + buildConditionExp(s) + "}}", a.result.shown = (0, _exp2.default)(r), s.push("" + e.substr(2, e.length - 4))) : i.push({
    line: n.line || 1,
    column: n.col || 1,
    reason: "WARNING: Elif 属性为空"
  }), r
}

function checkFor(e, t, a) {
  var n = t.log;
  if (e) {
    e = _exp2.default.removeExprffix(e);
    var s = void 0,
      i = void 0,
      r = e.match(/(.*) (?:in) (.*)/);
    if (r) {
      var l = r[1].match(/\((.*),(.*)\)/);
      l ? (s = l[1].trim(), i = l[2].trim()) : i = r[1].trim(), e = r[2]
    }
    e = "{{" + e + "}}";
    var o = void 0;
    s || i ? (o = {
      exp: (0, _exp2.default)(e)
    }, s && (o.key = s), i && (o.value = i)) : o = (0, _exp2.default)(e), t.result.repeat = o
  } else n.push({
    line: a.line || 1,
    column: a.col || 1,
    reason: "WARNING: for 属性为空"
  })
}

function checkEvent(name, value, output) {
  var eventName = name.replace(/^(on|@)/, "");
  if (eventName && value) {
    value = _exp2.default.removeExprffix(value);
    var paramsMatch = value.match(/(.*)\((.*)\)/);
    if (paramsMatch) {
      var funcName = paramsMatch[1],
        params = paramsMatch[2];
      params ? (params = params.split(/\s*,\s*/), -1 === params.indexOf("evt") && (params[params.length] = "evt")) : params = ["evt"], value = "{{" + funcName + "(" + params.join(",") + ")}}", value = eval("(function (evt) {" + (0, _exp2.default)(value, !1).replace("this.evt", "evt") + "})")
    }
    output.result.events = output.result.events || {}, output.result.events[eventName] = value
  }
}

function checkAttr(e, t, a, n, s) {
  e && (0, _utils.isValidValue)(t) && (a.result.attr = a.result.attr || {}, a.result.attr[(0, _utils.hyphenedToCamelCase)(e)] = (0, _exp2.default)(t), "value" === e && "text" === n && a.log.push({
    line: s.line,
    column: s.column,
    reason: "WARNING: `value` 应该写在<text>标签中"
  }))
}

function isReservedTag(e) {
  return tagReserved.indexOf(e) > -1
}

function isTextContentAomtic(e) {
  return tagTextCotent.indexOf(e) > -1 && tagAtomics.indexOf(e) > -1
}

function isSupportSpan(e) {
  if (e && "string" == typeof e) return tagChildrenMap[e] && tagChildrenMap[e].indexOf("span") > -1
}

function getTagChildren(e) {
  if (e && "string" == typeof e) return tagChildrenMap[e] || []
}

function isSupportedSelfClosing(e) {
  if (e && "string" == typeof e) return tagNatives[e] && !!tagNatives[e].selfClosing
}

function buildConditionExp(e) {
  return e.map(function(e) {
    return "!(" + e + ")"
  }).join(" && ")
}
Object.defineProperty(exports, "__esModule", {
  value: !0
});
var _exp = require("./exp"),
  _exp2 = _interopRequireDefault(_exp),
  _style = require("../style"),
  _style2 = _interopRequireDefault(_style),
  _utils = require("../utils"),
  _info = require("../info"),
  info = _interopRequireWildcard(_info),
  RESERVED_TAGS = ["template", "import", "script", "style"],
  tagCommon = {
    events: ["click", "focus", "blur", "longpress", "appear", "disappear", "swipe"],
    attrs: {
      id: {},
      style: {},
      class: {},
      disabled: {
        enum: ["false", "true"]
      },
      if: {
        def: "true"
      },
      elif: {
        def: "true"
      },
      else: {},
      for: {},
      tid: {},
      show: {
        def: "true"
      }
    },
    children: ["block", "slot"],
    parents: ["block"]
  },
  tagNatives = {
    div: {},
    a: {
      textContent: !0,
      children: ["span"],
      attrs: {
        visited: {
          enum: ["false", "true"]
        },
        href: {}
      }
    },
    text: {
      textContent: !0,
      children: ["a", "span"],
      attrs: {
        type: {
          enum: ["text", "html"]
        }
      }
    },
    span: {
      textContent: !0,
      atomic: !0,
      excludeRoot: !0,
      parents: ["text", "a"],
      attrs: {
        extendCommon: !1,
        id: {},
        style: {},
        class: {},
        for: {},
        tid: {},
        if: {
          def: "true"
        },
        elif: {
          def: "true"
        },
        else: {}
      }
    },
    label: {
      textContent: !0,
      atomic: !0,
      attrs: {
        target: {}
      }
    },
    image: {
      alias: ["img"],
      atomic: !0,
      attrs: {
        src: {},
        alt: {}
      }
    },
    slider: {
      selfClosing: !0,
      atomic: !0,
      attrs: {
        enabled: {
          enum: ["true", "false"]
        },
        min: {
          def: 0
        },
        max: {
          def: 100
        },
        step: {
          def: 1
        },
        value: {
          def: 0
        }
      },
      events: ["change"]
    },
    web: {
      atomic: !0,
      events: ["pagestart", "pagefinish", "titlereceive", "error"],
      attrs: {
        src: {}
      }
    },
    list: {
      children: ["list-item"],
      attrs: {
        scrollpage: {
          enum: ["false", "true"]
        }
      },
      events: ["scroll", "scrollbottom", "scrolltop"]
    },
    "list-item": {
      excludeRoot: !0,
      parents: ["list"],
      attrs: {
        type: {
          required: !0
        }
      }
    },
    block: {
      excludeRoot: !0,
      attrs: {
        extendCommon: !1,
        for: {},
        tid: {},
        if: {
          def: "true"
        },
        elif: {
          def: "true"
        },
        else: {}
      }
    },
    slot: {
      selfClosing: !0,
      atomic: !0,
      excludeRoot: !0,
      attrs: {
        extendCommon: !1,
        content: {}
      }
    },
    input: {
      atomic: !0,
      attrs: {
        type: {
          enum: ["text", "button", "checkbox", "radio", "email", "date", "time", "number", "password"]
        },
        checked: {
          enum: ["false", "true"]
        },
        name: {},
        value: {},
        placeholder: {}
      },
      events: ["change"]
    },
    button: {
      textContent: !0,
      atomic: !0
    },
    refresh: {
      attrs: {
        offset: {
          def: "132px"
        },
        refreshing: {
          enum: ["false", "true"]
        }
      },
      events: ["refresh"]
    },
    swiper: {
      attrs: {
        index: {
          def: 0
        },
        autoplay: {
          enum: ["false", "true"]
        },
        interval: {
          def: 3e3
        },
        indicator: {
          enum: ["true", "false"]
        }
      },
      events: ["change"]
    },
    progress: {
      selfClosing: !0,
      atomic: !0,
      attrs: {
        percent: {
          def: 0
        },
        type: {
          enum: ["horizontal", "circular"]
        }
      }
    },
    picker: {
      selfClosing: !0,
      atomic: !0,
      attrs: {
        type: {
          required: !0,
          enum: ["text", "date", "time"]
        },
        start: {
          def: "1970-1-1"
        },
        end: {
          def: "2100-12-31"
        },
        range: {},
        selected: {},
        value: {}
      },
      events: ["change"]
    },
    switch: {
      selfClosing: !0,
      atomic: !0,
      attrs: {
        checked: {
          enum: ["false", "true"]
        }
      },
      events: ["change"]
    },
    textarea: {
      atomic: !0,
      textContent: !0,
      attrs: {
        placeholder: {}
      },
      events: ["change"]
    },
    video: {
      atomic: !0,
      attrs: {
        src: {},
        autoplay: {
          enum: ["false", "true"]
        },
        poster: {}
      },
      events: ["prepared", "start", "pause", "finish", "error", "seeking", "seeked", "timeupdate", "fullscreenchange"]
    },
    map: {
      atomic: !0
    },
    canvas: {
      atomic: !0
    },
    stack: {},
    richtext: {
      textContent: !0,
      atomic: !0,
      attrs: {
        type: {
          enum: info.name.richtextType.concat("html")
        }
      }
    },
    tabs: {
      children: ["tab-bar", "tab-content"],
      attrs: {
        index: {
          def: 0
        }
      },
      events: ["change"]
    },
    "tab-content": {
      parents: ["tabs"]
    },
    "tab-bar": {
      parents: ["tabs"],
      attrs: {
        mode: {
          enum: ["fixed", "scrollable"]
        }
      }
    },
    popup: {
      children: ["text"],
      attrs: {
        target: {
          required: !0
        },
        placement: {
          enum: ["left", "top", "right", "bottom", "topLeft", "topRight", "bottomLeft", "bottomRight"],
          def: "bottom"
        }
      }
    },
    rating: {
      atomic: !0,
      attrs: {
        numstars: {
          def: "5"
        },
        rating: {
          def: "0"
        },
        stepsize: {
          def: "0.5"
        },
        indicator: {
          enum: ["false", "true"]
        }
      },
      events: ["change"]
    },
    select: {
      children: ["option"],
      events: ["change"],
      excludeRoot: !0
    },
    option: {
      parents: ["select"],
      atomic: !0,
      textContent: !0,
      attrs: {
        selected: {
          def: !1
        },
        value: {}
      },
      excludeRoot: !0
    }
  },
  tagReserved = [],
  tagAliasMap = {},
  tagAttrMap = {},
  tagEnumAttrMap = {},
  tagDefaultAttrMap = {},
  tagRequireAttrMap = {},
  tagAtomics = [],
  tagTextCotent = [],
  tagChildrenMap = {},
  tagParentsMap = {},
  tagEventsMap = {},
  tagNotRoot = [];
! function() {
  Object.keys(tagNatives).forEach(function(e) {
    tagReserved.push(e);
    var t = tagNatives[e];
    t.atomic && tagAtomics.push(e), t.textContent && tagTextCotent.push(e), t.alias && t.alias.length && t.alias.forEach(function(t) {
      tagAliasMap[t] = e
    }), !0 === t.excludeRoot && tagNotRoot.push(e);
    var a = (0, _utils.extend)({}, t.attrs),
      n = {},
      s = {},
      i = [];
    t.attrs && !1 === t.attrs.extendCommon || (a = (0, _utils.extend)(a, tagCommon.attrs)), "extendCommon" in a && delete a.extendCommon, Object.keys(a).forEach(function(e) {
      var t = a[e];
      t.enum && t.enum.length > 0 && (n[e] = t.enum, s[e] = t.enum[0]), t.def && (s[e] = t.def), !0 === t.required && i.push(e)
    }), tagAttrMap[e] = a, tagEnumAttrMap[e] = n, tagDefaultAttrMap[e] = s, tagRequireAttrMap[e] = i, tagChildrenMap[e] = t.children ? (0, _utils.merge)([], tagCommon.children, t.children) : null, tagParentsMap[e] = t.parents ? (0, _utils.merge)([], tagCommon.parents, t.parents) : null, tagEventsMap[e] = (0, _utils.merge)([], tagCommon.events, t.events)
  })
}(), exports.default = {
  checkTagName: checkTagName,
  checkId: checkId,
  checkClass: checkClass,
  checkStyle: checkStyle,
  checkIf: checkIf,
  checkElse: checkElse,
  checkElif: checkElif,
  checkFor: checkFor,
  checkEvent: checkEvent,
  checkAttr: checkAttr,
  checkBuild: checkBuild,
  isReservedTag: isReservedTag,
  isTextContentAomtic: isTextContentAomtic,
  isSupportSpan: isSupportSpan,
  getTagChildren: getTagChildren,
  isSupportedSelfClosing: isSupportedSelfClosing
};
