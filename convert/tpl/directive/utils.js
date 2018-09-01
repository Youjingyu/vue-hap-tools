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

module.exports = {
  convertExpress,
  convertObjProp,
  parseEventCb,
  resolveVModel
}
