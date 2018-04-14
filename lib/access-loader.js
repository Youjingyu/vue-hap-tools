"use strict";

function _interopRequireDefault(e) {
  return e && e.__esModule ? e : {
    default: e
  }
}
var _loaderUtils = require("loader-utils"),
  _loaderUtils2 = _interopRequireDefault(_loaderUtils);
module.exports = function(e) {
  if (this.cacheable && this.cacheable(), !(_loaderUtils2.default.parseQuery(this.resourceQuery) || {}).isEntry) return e;
  return e += "\n\n  const moduleOwn = exports.default || module.exports\n  const accessors = ['public', 'protected', 'private']\n\n  if (moduleOwn.data && accessors.some(function (acc) { return moduleOwn[acc] })) {\n    throw new Error('页面VM对象中的属性data不可与\"' + accessors.join(',') + '\"同时存在，请使用private替换data名称')\n  }\n  else if (!moduleOwn.data) {\n    moduleOwn.data = {}\n    moduleOwn._descriptor = {}\n    accessors.forEach(function (acc) {\n      const accType = typeof moduleOwn[acc]\n      if (accType === 'object') {\n        moduleOwn.data = Object.assign(moduleOwn.data, moduleOwn[acc])\n        for (const name in moduleOwn[acc]) {\n          moduleOwn._descriptor[name] = { access: acc }\n        }\n      }\n      else if (accType === 'function') {\n        console.warn('页面VM对象中的属性' + acc + '的值不能是函数，请使用对象')\n      }\n    })\n  }\n"
};
