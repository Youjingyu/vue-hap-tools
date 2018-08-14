const escodegen = require('escodegen')
const { getFuncAttrAst, getFuncBodyAst } = require('../../utils')

module.exports = function (methods, createdHookAst) {
  const resAst = []

  const dataAst = getFuncAttrAst('data', `
    const def = this.$app.$def
    _qa_vue = new def._qa_Vue(_qa_vue_options)
    const vmData = def._qa_get_vm_data(_qa_vue)
    def._qa_bind_watch(this, _qa_vue, vmData)
    return vmData
  `)
  resAst.push(dataAst)

  if (createdHookAst) {
    const onInitAst = getFuncAttrAst('onInit', `
      const _qa_created_cook = ${escodegen.generate(createdHookAst)}
      _qa_created_cook.call(_qa_vue)
    `)
    resAst.push(onInitAst)
  }

  const onReadyAst = getFuncAttrAst('onReady', '_qa_vue.$mount()')
  resAst.push(onReadyAst)

  methods.forEach(method => {
    const name = method.key.name || method.key.value
    // method是引用类型，不能直接修改method，因为vueOptionsAst还需要用到method
    const cloneMethod = JSON.parse(JSON.stringify(method))
    cloneMethod.value.body = getFuncBodyAst(`_qa_vue['${name}'].apply(_qa_vue, arguments)`)
    resAst.push(cloneMethod)
  })

  return {
    'type': 'ExportDefaultDeclaration',
    'declaration': {
      'type': 'ObjectExpression',
      'properties': resAst
    }
  }
}
