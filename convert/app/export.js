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
    qaVm._vm = vm
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
    vm._$emit = vm.$emit
    vm.$emit = function (e, data) {
      // vm._$emit.call(vm, e, data)
      e = convertEvent(e)
      qaVm.$emit.call(qaVm, e, data);
    }
    vm._$on = vm.$on
    vm.$on = function (e, cb) {
      // vm._$on.call(vm, e, cb)
      e = convertEvent(e)
      qaVm.$on.call(qaVm, e, cb);
    }
    vm._$off = vm.$off
    vm.$off = function (e) {
      // vm._$off.call(vm, e)
      e = convertEvent(e)
      qaVm.$off.call(qaVm, e);
    }
    vm._$set = vm.$set
    vm.$set = function (target, key, value) {
      vm._$set(target, key, value)
      if (target === vm && !(key in qaVm) && (!/\\./.test(key))) {
        qaVm.$set(key, value)
        vm.$watch(key, (newVal) => {
          qaVm[key] = newVal
        })
      }
    }
    vm._$delete = vm.$delete
    vm.$delete = function () {
      vm._$delete.apply(vm, arguments)
      qaVm.$delete.apply(qaVm, arguments)
    }
    return {
      vm,
      vmData: _qa_clone(vmData)
    }
  `, 'qaVm, vueOptions, extra'))
  prop.push(getFuncAttrAst('_qa_proxy', `
    const len = args.length
    const $event = args[len - 1]
    const eventId = args[len - 2].id
    // 不转换一遍，拿不到event属性
    const target = JSON.parse(JSON.stringify($event.target))
    let eventTypes = target.event || []
    if (target.attr.type === 'text') {
      const index = eventTypes.indexOf('change')
      if (index > -1) eventTypes[index] = 'input'
    } else if (target.attr.type === 'checkbox') {
      // 快应用在触发click事件时，event类型不正确
      const index = eventTypes.indexOf('change')
      if (($event.checked === null || $event.checked === undefined) && index > -1) {
        eventTypes.splice(index, 1)
      }
    }
    const handles = _qa_get_handle(vm._vnode, eventId, eventTypes)
    if (handles.length) {
      const event = _qa_wrap_event($event, target)
      if (handles.length === 1) {
        return handles[0](event)
      }
      handles.forEach(h => h(event))
    }
  `, 'args, vm'))

  return exportStatement
}
