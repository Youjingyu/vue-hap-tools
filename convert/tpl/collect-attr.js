const logger = require('../../utils/logger')

module.exports = function collectAttr (node) {
  const { attrs, tagName } = node

  // input 默认类型为 text
  let nodeType = tagName === 'input' ? 'text' : tagName
  let vModel
  let vFor
  let parentVFor = getParentVFor(node)
  // let clickEventCb
  // let inputEventCb
  let changeEventCb
  let className
  let style

  attrs.forEach((attr, index) => {
    const { name, value } = attr
    // 确定input类型
    if (tagName === 'input' && name === 'type') {
      nodeType = value
      return
    }
    if (name === 'class') {
      className = { value, index }
    } else if (name === 'style') {
      style = { value, index }
    } else if (name === 'v-model') {
      vModel = value
    } else if (name === 'v-for') {
      vFor = getVForInfo(value)
      if (vFor) {
        node.vFor = vFor
      }
    } else if (/^(@|v-on:)change$/.test(name)) {
      changeEventCb = { value, index }
    }
    // else if (/^(@|v-on:)click$/.test(name)) {
    //   clickEventCb = { value, index }
    // } else if (/^(@|v-on:)input$/.test(name)) {
    //   inputEventCb = { value, index }
    // }
  })
  return {
    nodeType,
    vModel,
    vFor,
    parentVFor,
    // clickEventCb,
    // inputEventCb,
    changeEventCb,
    className,
    style
  }
}

function getVForInfo (vForVal) {
  const seg = vForVal.trim().match(/^\(?(.+?)\)?\s+in\s+(.+)/)
  if (!seg) {
    logger.error('invalid v-for')
    return
  }
  const vForParam = seg[1]
  const vForData = seg[2]
  let [vForItem, vForIndex] = vForParam.split(/,\s*/)
  if (!vForIndex) {
    vForIndex = 'i'
  }
  return {
    vForData,
    vForItem,
    vForIndex,
    vForVal: `(${vForIndex},${vForItem}) in ${vForData}`
  }
}

function getParentVFor (node) {
  while (node) {
    if (node.vFor) return node.vFor
    node = node.parentNode
  }
  return null
}
