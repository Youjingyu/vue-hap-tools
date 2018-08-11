const { getAttrAst, getFuncAttrAst } = require('../utils')

module.exports = function (exportStatement, vueDeclaName) {
  const prop = exportStatement.declaration.properties

  prop.push(getAttrAst('_qa_Vue', vueDeclaName))
  prop.push(getAttrAst('_qa_bind_watch', '_qa_bind_watch'))
  prop.push(getFuncAttrAst('_qa_get_vm_data', `
    // 确保当前 vm 所有数据被同步
    const dataKeys = [].concat(
      Object.keys(vm._data || {}),
      Object.keys(vm._props || {}),
      Object.keys(vm._computedWatchers || {})
    );
    return dataKeys.reduce(function (res, key) {
      res[key] = vm[key];
      return res
    }, {})
  `, 'vm'))

  return exportStatement
}
