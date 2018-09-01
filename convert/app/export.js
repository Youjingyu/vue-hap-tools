const { getFuncAttrAst } = require('../utils')

module.exports = function (exportStatement, vueDeclaName) {
  const prop = exportStatement.declaration.properties

  prop.push(getFuncAttrAst('_qa_init_vue', `
    const { props } = extra
    if (props) {
      const propsObj = {}
      props.forEach(prop => {
        propsObj[prop] = {default: qaVm[prop]}
      })
      vueOptions.props = propsObj
    }
    const vm = new ${vueDeclaName}(vueOptions)
    // 确保当前 vm 所有数据被同步
    const dataKeys = [].concat(
      Object.keys(vm._data || {}),
      Object.keys(vm._computedWatchers || {})
    );
    const vmData = dataKeys.reduce(function (res, key) {
      res[key] = vm[key];
      return res
    }, {})
    _qa_bind_watch(qaVm, vm, vmData)
    const convertEvent = (e) => {
      return e.replace(/-./g, ($1) => {
        return $1.substring(1).toUpperCase()
      })
    }
    vm.$emit = function (e, data) {
      e = convertEvent(e)
      qaVm.$emit.call(qaVm, e, data);
    }
    vm.$on = function (e, cb) {
      e = convertEvent(e)
      qaVm.$on.call(qaVm, e, cb);
    }
    vm.$off = function (e) {
      e = convertEvent(e)
      qaVm.$off.call(qaVm, e);
    }
    vm.$once = function (e, cb) {
      vm.$on(e, () => {
        cb && cb()
        vm.$off(event)
      })
    }
    vm._$set = vm.$set
    vm.$set = function (target, key, value) {
      vm._$set(target, key, value)
      qaVm.$set(key, value)
      vm.watch(target[key], (newVal) => {
        qaVm[key] = newVal
      })
    }
    vm._$delete = vm.$delete
    vm.$delete = function () {
      vm._$delete.apply(vm, arguments)
      qaVm.$delete.apply(qaVm, arguments)
    }
    return {
      vm,
      vmData
    }
  `, 'qaVm, vueOptions, extra'))
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
