const resolveExport = require('./export')

module.exports = function (astBody, tplRes) {
  let exportResult
  let importDecla = []
  let otherCode = []
  astBody.forEach((item) => {
    if (item.type === 'ImportDeclaration') {
      importDecla.push(item)
    } else if (item.type === 'ExportDefaultDeclaration') {
      exportResult = resolveExport(item, tplRes)
    } else {
      // 非import、export代码
      otherCode.push(item)
    }
  })

  // 收集import的组件
  const indexToDelete = []
  let componentsCollection = []
  importDecla.forEach((importItem, index) => {
    const importName = importItem.specifiers[0].local.name
    const value = importItem.source.value
    const componentName = getComponentsName(exportResult.components, importName)
    if (componentName) {
      componentsCollection.push({
        name: componentName,
        // 去除后缀名
        value: value.replace(/\.vue$/, '')
      })
      indexToDelete.push(index)
    }
  })
  // 删除组件的import
  importDecla = importDecla.filter((cur, i) => {
    if (indexToDelete.indexOf(i) > -1) return false
    return true
  })

  return {
    importDecla,
    otherCode,
    exportResult,
    components: componentsCollection
  }
}

function getComponentsName (components, importName) {
  for (let item of components) {
    if (item.value === importName) {
      return item.name
    }
  }
  return false
}
