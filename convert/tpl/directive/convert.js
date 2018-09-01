const { convertExpress, resolveVModel, parseEventCb } = require('./utils')
const dynamicClassStyle = require('./class-style-bind')

module.exports = {
  'v-for' (value, attrInfo) {
    return {
      name: 'for',
      value: attrInfo.vFor.vForVal
    }
  },
  'v-if' (value) {
    return {
      name: 'if',
      value: convertExpress(value)
    }
  },
  '^v-else-if$' (value) {
    return {
      name: 'elif',
      value: convertExpress(value)
    }
  },
  '^v-else$' (value) {
    return {
      name: 'else',
      value
    }
  },
  'v-show' (value) {
    return {
      name: 'show',
      value: convertExpress(value)
    }
  },
  '^(:|v-bind:)(.*?)$' (value, attrInfo, matches) {
    const name = matches[2]
    let val
    let indexToDelete
    // 动态绑定的class、style
    if (name === 'class') {
      val = dynamicClassStyle(value, 'class')
      if (attrInfo.className) {
        val = attrInfo.className.value + ' ' + val
        indexToDelete = attrInfo.className.index
        // console.log(val, indexToDelete)
      }
    } else if (name === 'style') {
      val = dynamicClassStyle(value, 'style')
      if (attrInfo.style) {
        val = val + ';' + attrInfo.style.value + ';'
        indexToDelete = attrInfo.style.index
      }
    } else {
      val = convertExpress(value)
    }

    return {
      name,
      value: val,
      indexToDelete
    }
  },
  'v-model' (value, attrInfo) {
    let name = 'v-model'
    const { nodeType } = attrInfo
    let extra = {}
    if (nodeType === 'text') {
      name = 'value'
      extra = resolveVModel(value, attrInfo, 'value', 'onchange', 'changeEventCb')
    } else if (nodeType === 'radio' || nodeType === 'checkbox') {
      name = 'checked'
      extra = resolveVModel(value, attrInfo, 'checked', 'onchange', 'changeEventCb')
    }
    return {
      name,
      value: convertExpress(value),
      ...extra
    }
  },
  '^(@|v-on:)(.*?)$' (value, attrInfo, matches, components) {
    // 去除事件修饰符
    const name = 'on' + matches[2].split('.')[0]
    // 由于快应用的bug，自定义事件的回调函数不能写成自执行传参的形式：cb(para1, para2)
    // 不能做proxy，因此自定义组件的事件回调不做转换
    const customComponentsIndex = components.findIndex((comp) => {
      return comp.name === attrInfo.nodeType
    })
    if (customComponentsIndex > -1) {
      return {
        name,
        value,
        customEventCb: value
      }
    }
    const { cbName, params } = parseEventCb(value)
    let extraParam = `{n:'${cbName}'`
    // 判断是否使用了$event变量
    let $eventIndex = params.indexOf('$event')
    if ($eventIndex > 0) {
      extraParam += `,i:${$eventIndex}`
    }
    extraParam += '}'
    params.push(extraParam)
    return {
      name,
      value: `_qa_proxy(${params.join(',')})`
    }
  },
  ref (value, attrInfo, matches, components) {
    let refType = 'ele'
    const customComponentsIndex = components.findIndex((comp) => {
      return comp.name === attrInfo.nodeType
    })
    if (customComponentsIndex > -1) {
      refType = 'comp'
    }
    return {
      name: 'id',
      value,
      ref: {
        type: refType,
        name: value
      }
    }
  }
}
