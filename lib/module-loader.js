"use strict";
var _utils = require("./utils"),
  _shared = require("./shared");
module.exports = function(e) {
  var r = (0, _shared.updateSourceScript)(e);
  e = r.fileCont, (0, _utils.logWarn)(this, r.logFeatureList);
  var a = e.match(/require\s*\(['"]@([^()]+?)['"]\)/g);
  a && a.length > 0 && a.forEach(function(r) {
    e = e.replace(r, r.replace("require", "$app_require$").replace("@", "@app-module/"))
  });
  var t = e.match(/import\s+([^()]+?)\s+from\s+['"]@([^()]+?)['"]/g);
  return t && t.length > 0 && t.forEach(function(r) {
    e = e.replace(r, r.replace("import", "var").replace("from", "= $app_require$(").replace("@", "@app-module/") + ");")
  }), e
};
