const map = {
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
    // todo 支持对象形式的style
    if (name !== 'class') {
      return {
        name,
        value: convertExpress(value)
      }
    }
    value = convertObjProp(value)
    const res = { name, value }
    if (attrInfo.className) {
      res.value = attrInfo.className.value + ' ' + value
      res.indexToDelete = attrInfo.className.index
    }
    return res
  },
  'v-model' (value, attrInfo) {
    let name = 'v-model'
    const { nodeType } = attrInfo
    let extra = {}
    if (nodeType === 'text') {
      name = 'value'
      extra = resolveVModel(value, attrInfo, 'value', 'onchange', 'inputEventCb')
    } else if (nodeType === 'radio' || nodeType === 'checkbox') {
      name = 'checked'
      extra = resolveVModel(value, attrInfo, 'checked', 'onchange', 'clickEventCb')
    }
    return {
      name,
      value: convertExpress(value),
      ...extra
    }
  },
  '^(@|v-on:)(.*?)$' (value, attrInfo, matches, components) {
    // 由于快应用的bug，自定义事件的回调函数不能写成自执行传参的形式：cb(para1, para2)
    // 不能做proxy，因此自定义组件的事件回调不做转换
    const customComponentsIndex = components.findIndex((comp) => {
      return comp.name === attrInfo.nodeType
    })
    if (customComponentsIndex > -1) {
      return {
        name: 'on' + matches[2],
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
      name: 'on' + matches[2],
      value: `_qa_proxy(${params.join(',')})`
    }
  }
}

module.exports = function (name, value, attrInfo, components = []) {
  for (let key in map) {
    const matches = name.match(new RegExp(key))
    if (name.match(new RegExp(key))) {
      const res = map[key](value, attrInfo, matches, components)
      // console.log(res)
      return res
    }
  }
  return {
    name,
    value
  }
}

function convertExpress (val) {
  return '{{' + val + '}}'
}

function convertObjProp (prop) {
  // 转换对象形式的class
  if (/^{(.|\n|\t)+?}$/.test(prop)) {
    // 删除对象前后的括号，删除空白字符
    // hap-tools会以空格拆分表达式
    let keyValPair = prop.replace(/^([ ]*{)|(}[ ]*)$/g, '').replace(/\s+/g, '').split(',')
    keyValPair = keyValPair.map((item) => {
      const keyVal = item.split(':')
      // 如果class名有单引号，先去除单引号
      const key = keyVal.shift().replace(/'/g, '')
      // 处理有三元表达式的情况
      const value = keyVal.join(':')
      // 将对象形式的class转为三元表达式
      return convertExpress(`${value}?'${key}':''`)
    })
    return keyValPair.join(' ')
  } else {
    return convertExpress(prop)
  }
}

function parseEventCb (cbValue) {
  cbValue = cbValue.trim().replace(/\)/, '')
  let [cbName, paramsStr] = cbValue.split('(')
  let params = []
  if (paramsStr) {
    paramsStr = paramsStr.trim()
    params = paramsStr.split(/\s*,\s*/).map(param => {
      return param.replace(/,|\(|\)/g, '')
    })
  }
  return {
    params,
    cbName
  }
}

let vModelId = 0
function resolveVModel (vModelVal, attrInfo, valAttr, event, eventCbKey) {
  let indexToDelete
  let cbParams = []
  let vModel = {
    cbName: `_qa_vmodel_${vModelId}`,
    vModelVal,
    valAttr
  }
  vModelId++
  // 是否已经存在v-model对应的事件
  if (attrInfo[eventCbKey]) {
    const { value, index } = attrInfo[eventCbKey]
    const { cbName, params } = parseEventCb(value)
    // 判断是否使用了$event变量
    let $eventIndex = params.indexOf('$event')
    vModel.originCb = {
      params,
      cbName,
      $eventIndex
    }
    cbParams = params
    indexToDelete = index
  }
  // v-model是否嵌套在v-for中
  if (attrInfo.parentVFor) {
    const { vForData, vForItem, vForIndex } = attrInfo.parentVFor
    // v-model是否使用了v-for的变量
    if (new RegExp('^' + vForItem).test(vModelVal)) {
      cbParams.push(`{d:${vForData},i:${vForIndex}}`)
      vModel.vFor = {
        data: vForData,
        index: vForIndex
      }
    }
  }
  return {
    attrToPush: {
      name: event,
      value: `${vModel.cbName}` + (cbParams.length > 0 ? (`(${cbParams.join(',')})`) : '')
    },
    vModel,
    indexToDelete
  }
}
