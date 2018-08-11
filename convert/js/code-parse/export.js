const { resolveEventCallback } = require('../../utils')

module.exports = function resolveExport (exportAst, tplRes = {}) {
  let properties = exportAst && exportAst.declaration && exportAst.declaration.properties
  if (!properties) {
    properties = []
  }

  let components = []
  let methods = []

  let createdHook
  let propToDeleteIndex = []
  properties.forEach((prop, i) => {
    const name = prop.key.name
    switch (name) {
      case 'components':
        propToDeleteIndex.push(i)
        components = getComponents(prop)
        break
      case 'methods':
        methods = prop.value.properties
        break
      case 'created':
        propToDeleteIndex.push(i)
        createdHook = prop
        break
    }
  })

  // 删除转换后多余的属性
  properties = properties.filter((cur, i) => {
    return propToDeleteIndex.indexOf(i) < 0
  })

  // 如果有input change事件的回调，需要特殊处理
  if (tplRes.attrCollection) {
    methods = resolveEventCallback(methods, tplRes.attrCollection)
  }

  return {
    createdHookAst: createdHook && createdHook.value,
    components,
    vueOptionsAst: properties,
    methodNames: getMethodsName(methods)
  }
}

// 获取vue声明的组件
function getComponents (prop) {
  const components = []
  prop.value.properties.forEach((subProp) => {
    components.push({
      name: subProp.key.name || subProp.key.value,
      value: subProp.value.name
    })
  })
  return components
}

function getMethodsName (methods) {
  const res = []
  methods.forEach((method) => {
    res.push(method.key.name || method.key.value)
  })
  return res
}
