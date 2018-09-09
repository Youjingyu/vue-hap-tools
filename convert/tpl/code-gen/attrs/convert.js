function convertExpress (val) {
  return '{{' + val + '}}'
}

module.exports = {
  '^v-for$' (value, ast) {
    const { iterator1, alias, for: vFor } = ast
    return {
      name: 'for',
      value: `(${iterator1},${alias}) in ${vFor}`
    }
  },
  '^v-if$' (value) {
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
  '^v-show$' (value) {
    return {
      name: 'show',
      value: convertExpress(value)
    }
  },
  '^(:|v-bind:)(.*?)$' (value, ast, matches) {
    return {
      name: matches[2],
      value: convertExpress(value)
    }
  },
  '^(v-model)(\\.(.+))?$' (value, ast, matches) {
    const { tag } = ast
    const { type } = ast.attrsMap
    let name = 'v-model'
    // 修饰符
    // const modifiers = matches[3] && matches[3].split('.')
    if (tag === 'input') {
      name = 'value'
      if (type === 'radio' || type === 'checkbox') {
        name = 'checked'
      }
    }
    return {
      name,
      value: convertExpress(value)
    }
  },
  '^(@|v-on:)(.*?)$' (value, ast, matches, components) {
    // 去除事件修饰符
    const name = 'on' + matches[2].split('.')[0]
    // 由于快应用的bug，自定义事件的回调函数不能写成自执行传参的形式：cb(para1, para2)
    // 不能做proxy，因此自定义组件的事件回调不做转换
    const customComponentsIndex = components.findIndex((comp) => {
      return comp.name === ast.tag
    })
    if (customComponentsIndex > -1) {
      return {
        name,
        value,
        extra: {
          customEventCb: value
        }
      }
    }
    const eventId = ast.attrs.find((attr) => {
      return attr.name === 'data-eventid'
    })
    return {
      name,
      value: `_qa_proxy({id:${eventId && eventId.value}})`
    }
  },
  '^ref$' (value, ast, matches, components) {
    let refType = 'ele'
    const customComponentsIndex = components.findIndex((comp) => {
      return comp.name === ast.tag
    })
    if (customComponentsIndex > -1) {
      refType = 'comp'
    }
    return {
      name: 'id',
      value,
      extra: {
        ref: {
          type: refType,
          name: value
        }
      }
    }
  }
}
