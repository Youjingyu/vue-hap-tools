function convertExpress (val) {
  return '{{' + val + '}}'
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
  parseEventCb,
  resolveVModel
}
