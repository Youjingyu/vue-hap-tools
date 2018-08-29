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
  prop.push(getFuncAttrAst('_qa_proxy', `
    const len = args.length
    const $event = _qa_wrap_event(args[len -1 ])
    const eventInfo = args[len - 2]
    const eventCbName = eventInfo.n
    const $usedEventIndex = eventInfo.i
    args = [].slice.call(args, 0, -2)
    if (args.length === 1 && args[0] === undefined){
       args[0] = $event
    }
    if ($usedEventIndex !== undefined) {
      args[$usedEventIndex] = $event
    }
    vm[eventCbName].apply(vm, args)
  `, 'args, vm'))

  return exportStatement
}
