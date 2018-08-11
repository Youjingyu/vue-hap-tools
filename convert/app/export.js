const { getAttrAst, getFuncAttrAst } = require('../utils')

module.exports = function (exportStatement, vueDeclaName) {
  const prop = exportStatement.declaration.properties

  prop.push(getAttrAst('_qa_Vue', vueDeclaName))
  prop.push(getFuncAttrAst('_qa_bind_watch', `
    keyPath = keyPath || ''
    Object.keys(vmData).forEach((key) => {
      const fullKeyPath = keyPath === '' ? key : keyPath + '.' + key
      if (Object.prototype.toString.call(obj) === '[object Object]'(vmData[key])) {
        bindWatch($qa, $vue, vmData[key], fullKeyPath)
      } else {
        const keyPathArr = keyPath === '' ? [] : keyPath.split('.')
        const len = keyPathArr.length
        $vue.$watch(fullKeyPath, (newVal) => {
          // 根据key path更新数据
          let data = $qa
          for (let i = 0; i < len; i++) {
            data = $qa[keyPathArr[i]]
          }
          data[key] = newVal
        })
      }
    })
  `, `$qa, $vue, vmData, keyPath`))
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
