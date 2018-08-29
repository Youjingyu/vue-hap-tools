module.exports = function resolveExport (exportAst) {
  let properties = exportAst && exportAst.declaration && exportAst.declaration.properties
  if (!properties) {
    properties = []
  }

  let components = []

  let createdHook
  let propToDeleteIndex = []
  let propsName = []
  let propsAst
  properties.forEach((prop, i) => {
    const name = prop.key.name
    switch (name) {
      case 'components':
        propToDeleteIndex.push(i)
        components = getComponents(prop)
        break
      case 'props':
        propToDeleteIndex.push(i)
        propsName = parseProps(prop)
        propsAst = prop
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
    vueOptionsAst: properties,
    propsName,
    propsAst
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

function parseProps (prop) {
  const propsName = []
  if (prop.value.type === 'ArrayExpression') {
    prop.value.elements.forEach((ele) => {
      propsName.push(ele.value || ele.raw)
    })
  } else if (prop.value.type === 'ObjectExpression') {
    prop.value.properties.forEach((ele) => {
      propsName.push(ele.key.name || ele.key.raw)
    })
  }
  return propsName
}
