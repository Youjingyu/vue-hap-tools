const escodegen = require('escodegen')
const { getFuncAttrAst } = require('../../utils')

module.exports = function (tplRes, createdHookAst, propsName, propsAst) {
  const resAst = []

  if (propsAst) {
    resAst.push(propsAst)
  }

  let watchProps = ''
  let propsParam = ''
  if (propsName && propsName.length > 0) {
    propsParam = propsName.map((name) => {
      watchProps += `this.$watch('${name}', '_qa_props_${name}')\n`
      return `'${name}'`
    }).join(',')
    propsParam = `,[${propsParam}]`
  }
  const dataAst = getFuncAttrAst('data', `
    const def = this.$app.$def
    const { vm, vmData } = def._qa_init_vue(this, _qa_vue_options${propsParam})
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

  const onReadyAst = getFuncAttrAst('onReady', `
    _qa_vue.$mount()
    ${watchProps}
  `)
  resAst.push(onReadyAst)

  const eventProxyAst = getFuncAttrAst('_qa_proxy', `
    this.$app.$def._qa_proxy(arguments, _qa_vue)
  `)
  resAst.push(eventProxyAst)

  if (tplRes && tplRes.vModels) {
    tplRes.vModels.forEach(vModel => {
      let { cbName, vModelVal, valAttr, originCb, vFor } = vModel
      let funcBody = `
        const len = arguments.length
        const $event = arguments[len - 1]
      `
      // 如果v-model元素嵌套在v-for中，且使用了v-for的变量
      if (vFor) {
        funcBody += `
          const _qa_vfor = arguments[len - 2]
        `
        // 将v-model值修改为v-for变量
        const seg = vModelVal.split('.')
        seg[0] = '_qa_vfor.d[_qa_vfor.i]'
        vModelVal = seg.join('.')
      } else {
        vModelVal = '_qa_vue.' + vModelVal
      }
      funcBody += `${vModelVal} = $event.target.attr.${valAttr}`

      // 如果存在与v-model冲突的事件，调用其回调函数
      if (originCb) {
        const { cbName, $eventIndex } = originCb
        funcBody += `
          const args = [].slice.call(arguments, 0, -2)
          args.push(
            {n:'${cbName}'${($eventIndex > -1 ? ',i:' + $eventIndex : '')}},
            $event
          )
          this.$app.$def._qa_proxy(args, _qa_vue)
        `
      }
      const vModelFunc = getFuncAttrAst(cbName, funcBody)
      resAst.push(vModelFunc)
    })
  }
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
