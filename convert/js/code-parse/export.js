module.exports = function resolveExport (exportAst) {
  let properties = exportAst && exportAst.declaration && exportAst.declaration.properties
  if (!properties) {
    properties = []
  }

  let components = []

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

  return {
    createdHookAst: createdHook && createdHook.value,
    components,
    vueOptionsAst: properties
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
