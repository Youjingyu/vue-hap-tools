"use strict";

function _interopRequireDefault(e) {
  return e && e.__esModule ? e : {
    default: e
  }
}

function findScriptFile(e) {
  for (var t = 0; t < name.scriptList.length; t++) {
    var r = "" + e + name.scriptList[t];
    if (_fs2.default.existsSync(r)) return r
  }
}
Object.defineProperty(exports, "__esModule", {
  value: !0
}), exports.name = exports.moduleName = exports.cmdName = void 0, exports.findScriptFile = findScriptFile;
var _fs = require("fs"),
  _fs2 = _interopRequireDefault(_fs),
  cmdName = exports.cmdName = "hap",
  moduleName = exports.moduleName = "hap-tools",
  extName = "",
  extFull = "." + extName,
  name = exports.name = {
    extList: [".mix", ".ux"],
    richtextType: ["mix", "ux"],
		scriptList:[".mix",".ux",".vue"]
  };
