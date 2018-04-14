"use strict";

function _interopRequireDefault(e) {
  return e && e.__esModule ? e : {
    default: e
  }
}

function frameworkInit() {
  global.framework = {
    module: {
      base: "system",
      ext: "service"
    },
    reservedFeatures: [],
    reservedFeatureExclude: [],
    project: {
      manifestFilePath: null,
      featureList: [],
      module: {
        usedBaseAll: !1,
        usedExtAll: !1
      }
    }
  }, global.framework.reservedFeatures = global.framework.reservedFeatures.concat([global.framework.module.base + ".contact", global.framework.module.base + ".webview", global.framework.module.base + ".notification", global.framework.module.base + ".media", global.framework.module.base + ".file", global.framework.module.base + ".storage", global.framework.module.base + ".vibrator", global.framework.module.base + ".calendar", global.framework.module.base + ".shortcut", global.framework.module.base + ".network", global.framework.module.base + ".fetch", global.framework.module.base + ".geolocation", global.framework.module.base + ".request", global.framework.module.base + ".share", global.framework.module.base + ".clipboard", global.framework.module.base + ".prompt", global.framework.module.base + ".device", global.framework.module.base + ".barcode", global.framework.module.base + ".bluetooth", global.framework.module.base + ".sensor", global.framework.module.base + ".audio", global.framework.module.ext + ".alipay", global.framework.module.ext + ".push", global.framework.module.ext + ".pay", global.framework.module.ext + ".share", global.framework.module.ext + ".wxpay", global.framework.module.ext + ".internal.activateinfo", global.framework.module.ext + ".internal.account"]), global.framework.reservedFeatureExclude.push(global.framework.module.base + ".app"), global.framework.reservedFeatureExclude.push(global.framework.module.base + ".model"), global.framework.reservedFeatureExclude.push(global.framework.module.base + ".router")
}

function updateSourceScript(e) {
  var r = [],
    a = new RegExp("['\"]@(" + global.framework.module.base + "|" + global.framework.module.ext + ").*?['\"]", "g"),
    o = new RegExp("['\"]@((" + global.framework.module.base + "|" + global.framework.module.ext + ").*?)['\"]");
  return (e.match(a) || []).forEach(function(e) {
    var a = (e.match(o) || [])[1];
    a === "@" + global.framework.module.base ? global.framework.project.module.usedBaseAll = !0 : a === "@" + global.framework.module.ext ? global.framework.project.module.usedExtAll = !0 : -1 !== global.framework.reservedFeatures.indexOf(a) ? -1 === global.framework.project.featureList.indexOf(a) && global.framework.project.featureList.push(a) : -1 !== global.framework.reservedFeatureExclude.indexOf(a) || r.push({
      reason: "WARN: 您引入了未识别的native模块：" + a + ")"
    })
  }), {
    fileCont: e,
    logFeatureList: r
  }
}

function updateManifest(e) {
  var r = null;
  try {
    r = JSON.parse(e)
  } catch (e) {
    throw _utils.colorconsole.error("ERROR: 解析manifest.json文件出错：" + e.message), e
  }
  if (r) {
    r.features = r.features || [];
    var a = [].concat(global.framework.project.featureList);
    r.features.forEach(function(e) {
      var r = a.indexOf(e.name); - 1 !== r && a.splice(r, 1)
    });
    var o = [];
    if (a.forEach(function(e) {
        -1 !== global.framework.reservedFeatures.indexOf(e) && o.push(e)
      }), o.length > 0) {
      var l = o.map(function(e) {
        return {
          name: e
        }
      });
      r.features = r.features.concat(l), _utils.colorconsole.warn("manifest.json文件中添加未声明的features: " + o.join(", ") + "\n")
    }
    return e = JSON.stringify(r, null, 2), {
      manifestCont: e
    }
  }
}

function updateProjectManifest(e) {
  try {
    var r = _fs2.default.readFileSync(e, "utf8");
    _fs2.default.writeFileSync(e, updateManifest(r).manifestCont, "utf8")
  } catch (r) {
    throw _utils.colorconsole.error("ERROR: 读取manifest.json文件[" + e + "]出错：" + r.message), r
  }
}
Object.defineProperty(exports, "__esModule", {
  value: !0
}), exports.updateProjectManifest = exports.updateSourceScript = void 0;
var _fs = require("fs"),
  _fs2 = _interopRequireDefault(_fs),
  _utils = require("./utils");
frameworkInit(), exports.updateSourceScript = updateSourceScript, exports.updateProjectManifest = updateProjectManifest;
