const tagConvertMap = require('./tag-map')
const collectAttr = require('./collect-attr')
const resolveDirective = require('./directive')

let codeGen

function process (ast, components) {
  if (ast.content) {
    ast.childNodes = ast.content.childNodes
  }
  if (!ast.childNodes) {
    return
  }
  ast.childNodes.forEach((item) => {
    item.attrs = item.attrs || []
    // button需要转为type为button的input
    if (item.tagName === 'button') {
      item.attrs.push({
        name: 'type',
        value: 'button'
      })
      // 快应用中button的文本需要写为value值
      if (item.childNodes && item.childNodes[0]) {
        item.attrs.push({
          name: 'value',
          value: item.childNodes[0].value
        })
      }
    }

    // 替换tag
    const cTag = tagConvertMap[item.tagName]
    if (cTag) {
      item.tagName = item.nodeName = cTag
    }

    const attrToDeleteIndex = []
    const attrsToPush = []
    // 先收集attr信息，用于进一步处理
    const attrInfo = collectAttr(item)
    // 替换attrs
    item.attrs.forEach((attr, index) => {
      const direcRes = resolveDirective(attr.name, attr.value, attrInfo, components)
      const { name, value, indexToDelete, vModel, attrToPush, customEventCb } = direcRes
      item.attrs[index].name = name
      item.attrs[index].value = value
      if (indexToDelete !== undefined) {
        attrToDeleteIndex.push(indexToDelete)
      }
      if (vModel) {
        codeGen.vModels.push(vModel)
      }
      if (attrToPush) {
        attrsToPush.push(attrToPush)
      }
      if (customEventCb) {
        codeGen.customEventCb.push(customEventCb)
      }
      // 特殊处理
      if (attr.name === 'key') {
        // 快应用不支持key属性
        attrToDeleteIndex.push(index)
      } else if (attr.name === 'for' && item.tagName === 'label') {
        // label的for属性需要转换为target
        item.attrs[index].name = 'target'
      } else if (attr.name === 'to' && item.tagName === 'a') {
        // router-link标签的to属性转换为href属性
        item.attrs[index].name = 'href'
      }
    })
    // 删除多余的属性
    // 比如:class、class两个属性转换后会重复
    item.attrs = item.attrs.filter((cur, index) => {
      return attrToDeleteIndex.indexOf(index) < 0
    })
    attrsToPush.forEach((attr) => {
      item.attrs.push({
        name: attr.name,
        value: attr.value
      })
    })
    // 列表不再转为list组件
    // 为转换后的list-item添加type属性
    // if(item.tagName === 'list-item'){
    //   const hasTypeProp = item.attrs && findAttr(item.attrs, 'type');
    //   if(!hasTypeProp){
    //     const typeProp = {
    //       name: 'type',
    //       value: 'kyy-normal-list'
    //     };
    //     item.attrs.push(typeProp);
    //   }
    // }

    // 转换后，如果如果出现text嵌套text，将子节点修改为span
    if (item.tagName === 'text' && ast.tagName === 'text') {
      item.tagName = item.nodeName = 'span'
    }
    process(item, components)
  })
  return {
    ast,
    codeGen: codeGen
  }
}

module.exports = function (ast, components) {
  codeGen = {
    vModels: [],
    customEventCb: []
  }
  return process(ast, components)
}
