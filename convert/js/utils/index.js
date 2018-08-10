const esprima = require('esprima')

function getFuncAttrAst (name, funcBodyStr = '', param = '') {
  funcBodyStr = /^function/.test(funcBodyStr) ? funcBodyStr : `function(${param}){${funcBodyStr}}`
  const temp = `var a={'${name}':${funcBodyStr}}`
  return esprima.parseScript(temp).body[0].declarations[0].init.properties[0]
}

function getVModelAst (vModels, e, keyToPolyfill) {
  // 将v-model监听的数据，添加到change的回调函数处理
  const jsStr = vModels.reduce((total, dataName) => {
    return total + `this.${dataName}=${e}.target.${keyToPolyfill};`
  }, '')
  return esprima.parseScript(jsStr).body
}

function getStatementAst (temp) {
  return esprima.parseScript(temp).body
}

function resolveEventCallback (methods, attrCollection) {
  methods.forEach((method) => {
    const changeFuncsWithVModel = attrCollection.changeFuncsWithVModel[method.key.name]
    if (changeFuncsWithVModel) {
      const keyToPolyfill = changeFuncsWithVModel.isCheckbox ? 'checked' : 'value'
      // 如果函数没有参数，需要添加参数
      if (method.value.params.length === 0) {
        method.value.params.push({'type': 'Identifier', 'name': 'e'})
      }
      const paramName = method.value.params[0].name
      // 在快应用中，e.target中没有value属性，这里添加value属性，兼容快应用
      // 即添加代码：e.target.value = e.value
      const assignAst = esprima.parseScript(`${paramName}.target.${keyToPolyfill}=${paramName}.${keyToPolyfill}`).body
      let vModelAst = []
      // 如果input既绑定了input事件，又绑定了v-model
      if (changeFuncsWithVModel.vModels.length > 0) {
        vModelAst = getVModelAst(changeFuncsWithVModel.vModels, paramName, keyToPolyfill)
      }
      // 合并代码
      method.value.body.body = assignAst.concat(vModelAst).concat(method.value.body.body)
    }
  })
  // 只绑定了v-model，没有绑定input事件
  if (attrCollection.vModels && attrCollection.vModels.length > 0) {
    // 手动添加事件回调，在回调中对监听的数据赋值
    attrCollection.vModels.forEach((item) => {
      const keyToPolyfill = item.isCheckbox ? 'checked' : 'value'
      const ast = getFuncAttrAst(item.changeFunc,
        `e.target.${keyToPolyfill}=e.${keyToPolyfill};this.${item.dataName}=e.target.${keyToPolyfill};`, 'e')
      methods.push(ast)
    })
  }
  return methods
}

module.exports = {
  getFuncAttrAst,
  getVModelAst,
  getStatementAst,
  resolveEventCallback
}
