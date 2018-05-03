const esprima = require('esprima');

module.exports = function(scriptString){
  const ast = esprima.parseModule(jsString)

  let components = []
  let componentsCollection = []  

  ast.body.forEach((item) => {
    if (item.type === 'ImportDeclaration') {
      importDela.push(item);
    } else if (item.type === 'ExportDefaultDeclaration') {
      components = resolveExport(item);
    } else {
      // 非import、export代码
      otherCode.push(item);
    }
  })

  // 遍历import的代码，与组件的值对比，拿到组件的名字与组件模块位置
  importDela.forEach((importItem, index) => {
    // import的变量名
    const importName = importItem.specifiers[0].local.name
    // import模块位置
    const value = importItem.source.value
    const componentName = getComponentsName(components, importName)
    if (componentName) {
      componentsCollection.push({
        name: componentName,
        value
      })
    }
  })
  
  // template部分拿到组件信息后，拼接成快引用支持的形式:
  // <import name="componentName" src="componentPath"></import>
  return componentsCollection
}

function resolveExport(exportAst){
  let properties = exportAst && exportAst.declaration && exportAst.declaration.properties;
  if (!properties) return
  
  let components = []
  properties.forEach((prop, i) => {
    const name = prop.key.name;
    switch (name) {
      // 找到components字段
      case 'components':
        components = getComponents(prop);
        break;
      // 其他代码省略...
    }
  });

  // 其他代码省略...
  return components
}

function getComponents (prop) {
  const components = [];
  prop.value.properties.forEach((subProp) => {
    // 获取组件名以及组件值对应的变量
    components.push({
      name: subProp.key.name || subProp.key.value,
      value: subProp.value.name
    })
  })
  return components
}

function getComponentsName (components, importName) {
  for (let item of components) {
    if (item.value === importName) {
      return item.name
    }
  }
  return false
}