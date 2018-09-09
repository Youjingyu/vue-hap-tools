const escodegen = require('escodegen')
const { getFuncAttrAst } = require('../../utils')

module.exports = function (tplRes, createdHookAst, propsName, propsAst) {
  const resAst = []

  if (propsAst) {
    resAst.push(propsAst)
  }

  let watchProps = ''
  let extraData = []
  if (propsName && propsName.length > 0) {
    let propsParam = propsName.map((name) => {
      watchProps += `this.$watch('${name}', '_qa_props_${name}')\n`
      return `'${name}'`
    }).join(',')
    extraData.push(`props:[${propsParam}]`)
  }

  const dataAst = getFuncAttrAst('data', `
    const def = this.$app.$def
    const { vm, vmData } = def._qa_init_vue(this, _qa_vue_options,{${extraData.join(',')}})
    _qa_vue = vm
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

  // 初始化时，不能在快应用实例上获取$root()、$parent()
  // 因此onReady中获取
  let refsHack = `
    const $root = this.$root()
    const $parent = this.$parent()
    _qa_vue.$root = $root && $root._vm
    _qa_vue.$parent = $parent && $parent._vm
    _qa_vue.$refs = {}
  `
  if (tplRes && tplRes.refs.length > 0) {
    refsHack += `
      const that = this
      const refs = ${JSON.stringify(tplRes.refs)}
      refs.forEach((ref) => {
        const refMethod = ref.type === 'ele' ? '$element' : '$child'
        Object.defineProperty(_qa_vue.$refs, ref.name, {
          get ()  {
            return that[refMethod](ref.name)
          }
        })
      })
  `
  }

  const onReadyAst = getFuncAttrAst('onReady', `
    _qa_vue.$mount()
    ${refsHack}
    ${watchProps}
  `)
  resAst.push(onReadyAst)

  const eventProxyAst = getFuncAttrAst('_qa_proxy', `
    this.$app.$def._qa_proxy(arguments, _qa_vue)
  `)
  resAst.push(eventProxyAst)

  if (tplRes && tplRes.customEventCb) {
    tplRes.customEventCb.forEach((cbName) => {
      const cbFunc = getFuncAttrAst(cbName, `
        _qa_vue['${cbName}'].call(_qa_vue, e.detail)
      `, 'e')
      resAst.push(cbFunc)
    })
  }
  if (propsName && propsName.length > 0) {
    propsName.forEach((name) => {
      resAst.push(getFuncAttrAst(`_qa_props_${name}`, `
        _qa_vue['${name}'] = newVal
      `, 'newVal'))
    })
  }

  return {
    'type': 'ExportDefaultDeclaration',
    'declaration': {
      'type': 'ObjectExpression',
      'properties': resAst
    }
  }
}
