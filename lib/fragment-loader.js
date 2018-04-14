"use strict";

function _interopRequireDefault(e) {
  return e && e.__esModule ? e : {
    default: e
  }
}
var _slicedToArray = function() {
    function e(e, t) {
      var n = [],
        r = !0,
        s = !1,
        a = void 0;
      try {
        for (var i, o = e[Symbol.iterator](); !(r = (i = o.next()).done) && (n.push(i.value), !t || n.length !== t); r = !0);
      } catch (e) {
        s = !0, a = e
      } finally {
        try {
          !r && o.return && o.return()
        } finally {
          if (s) throw a
        }
      }
      return n
    }
    return function(t, n) {
      if (Array.isArray(t)) return t;
      if (Symbol.iterator in Object(t)) return e(t, n);
      throw new TypeError("Invalid attempt to destructure non-iterable instance")
    }
  }(),
  _fs = require("fs"),
  _fs2 = _interopRequireDefault(_fs),
  _loaderUtils = require("loader-utils"),
  _loaderUtils2 = _interopRequireDefault(_loaderUtils),
  _parser = require("./parser"),
  _utils = require("./utils"),
  _info = require("./info");
module.exports = function(e, t) {
  var n = this;
  this.cacheable && this.cacheable();
  var r = this.async(),
    s = _loaderUtils2.default.parseQuery(this.query),
    a = _loaderUtils2.default.parseQuery(this.resourceQuery) || {},
    i = s.type,
    o = a.isEntry,
    l = this.resourcePath,
    u = s.index;
  null != u && u.match(/^\d+$/) && (u = parseInt(u)), (0, _parser.extractBlocks)(e, i).then(function(r) {
    null != u && (r = r[u]);
    var s = r.content.trim();
    if ("scripts" === i && o && "Y" === process.env.NODE_TEST)
      if (l.match(/src\/app\./)) s = "import '../node_modules/" + _info.moduleName + "/test/app.js'\n " + s;
      else {
        var a = l.replace("/src/", "/test/").replace(/\.\w{2,5}$/, ".js");
        if (_fs2.default.existsSync(a)) {
          var c = a.match(/\/test\/(.*)/)[1];
          s = "\nimport fnTestCase from '" + c + "'\n" + s, s = s.replace("export default {", "export default {\n    onCreate () {\n      // 测试执行：开始时间，结束事件\n      global.CASE_TEST_START = global.CASE_TEST_START || 1000\n      global.CASE_TEST_TIMEOUT = global.CASE_TEST_TIMEOUT || 2000\n\n      global.mocha = new Mocha({ reporter: 'json', timeout: global.CASE_TEST_TIMEOUT })\n      mocha.ui('bdd')\n      mocha.suite.emit('pre-require', global, null, mocha);\n      // 记录测试用例\n      typeof fnTestCase === 'function' && fnTestCase(this)\n      setTimeout(function() {\n        var mochaRunner = mocha.run(function () {\n          if (mochaRunner) {\n            // 标题\n            mochaRunner.testResults.stats.title = mocha.suite.suites && mocha.suite.suites[0] && mocha.suite.suites[0].title\n            console.info('testResults: ', JSON.stringify(mochaRunner.testResults))\n            pushData('pageTestList', mochaRunner.testResults)\n  \n            // 显示结果\n            const stats = mochaRunner.testResults.stats\n            this.$page.setTitleBar({ text: `通过/全部: ${stats.passes}/${stats.tests}` })\n          }\n\n          // 是否返回\n          if (this.back !== 'false') {\n            console.info('拥有关联测试用例，测试完毕，返回到之前的页面')\n            history.back()\n          }\n        }.bind(this))\n      }.bind(this), global.CASE_TEST_START)\n    },"), _utils.colorconsole.info("[INFO] 脚本注入测试用例：" + c)
        } else s = s.replace("export default {", "export default {\n    onCreate () {\n      // 测试执行：开始时间，结束事件\n      global.CASE_TEST_START = global.CASE_TEST_START || 1000\n      global.CASE_TEST_TIMEOUT = global.CASE_TEST_TIMEOUT || 2000\n\n      setTimeout(function() {\n        // 是否返回\n        if (this.back !== 'false') {\n          console.info('没有关联测试用例，直接返回到之前的页面')\n          history.back()\n        }\n      }.bind(this), global.CASE_TEST_START)\n    },")
      }
    var f = void 0;
    if (n.sourceMap && ("scripts" === i || "imports" === i)) {
      var T = r.location.line,
        _ = void 0;
      t && (_ = (0, _utils.consumeMap)(n, e, t), e = _.sourcesContent.join(""));
      var h = (0, _utils.splitSourceLine)(s).map(function(e, t) {
        t += 1;
        var n = t + T,
          r = t;
        return _ && (n = _.mapping["line-" + n + "-column-0"].line), {
          original: {
            line: n,
            column: 0
          },
          generated: {
            line: r,
            column: 0
          }
        }
      });
      f = (0, _utils.generateMap)(n, e, h)
    }
    return [s, f]
  }).then(function(e) {
    var n = _slicedToArray(e, 2),
      s = n[0],
      a = n[1];
    r(null, s, a && a.toJSON() || t)
  }).catch(function(e) {
    r(e, "")
  })
};
