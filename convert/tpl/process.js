const directives = require('./directive')
const tagConvertMap = require('./tag-map')

let attrCollection = {
  // 收集input事件的回调函数名（input事件会转为change事件），并将v-model值保存
  // 当绑定了input事件时，v-model的值保存在changeFuncs中
  changeFuncsWithVModel: {},
  // 如果没有绑定input事件，但有v-model，v-model的值保存在vModel中
  vModels: []
}

module.exports = process

function process (ast) {
  if (ast.content) {
    ast.childNodes = ast.content.childNodes
  }
  if (ast.childNodes) {
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
      // 先收集attr中的部分信息，并做处理
      const attrRes = collectAttr(item.attrs)
      item.attrs = attrRes.attrs
      // 替换attrs
      item.attrs.forEach((attr, index) => {
        const atrName = attr.name,
          atrVal = attr.value
        for (let key in directives) {
          const atrC = directives[key]
          const isIn = atrName.match(new RegExp(key))
          if (isIn) {
            const name = typeof atrC.attr === 'string' ? atrC.attr : atrC.attr(atrName, isIn, attrRes.extra)
            // 在vue中可以这样写：<input class="active" :class="normal">
            // 需要合并这两个属性
            const repeatAttr = findAttr(item.attrs, name)
            let staticValue
            if (repeatAttr) {
              attrToDeleteIndex.push(repeatAttr.index)
              staticValue = repeatAttr.attr.value
            }
            const value = atrC.val ? atrC.val(atrVal, isIn, staticValue) : atrVal
            item.attrs[index].name = name
            item.attrs[index].value = value
          }
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
      process(item)
    })
  }
  return {
    ast,
    attrCollection
  }
}

function findAttr (attrs, name) {
  for (let i = 0; i < attrs.length; i++) {
    if (attrs[i].name === name) {
      return {
        attr: attrs[i],
        index: i
      }
    }
  }
}

function collectAttr (attrs) {
  let inputFunc, vModel, isCheckbox = false, clickFunc
  let clickAttrIndex
  attrs.forEach((attr, i) => {
    // input事件的回调函数需要在转换js时，特殊处理
    if (/^(@|v-on:)(input)$/.test(attr.name)) {
      inputFunc = attr.value
    } else if (attr.name === 'v-model') {
      vModel = attr.value
    } else if (attr.name === 'type' && (attr.value === 'checkbox' || attr.value === 'radio')) {
      isCheckbox = true
    } else if (/^(@|v-on:)(click)$/.test(attr.name)) {
      clickFunc = attr.value
      clickAttrIndex = i
    }
  })

  // 将CheckBox的click事件替换为onchange事件
  if (isCheckbox && clickFunc) {
    attrs[clickAttrIndex].name = 'onchange'
  }

  // 具有input事件或者是有click事件的checkbox或者radio
  if (inputFunc || (isCheckbox && clickFunc)) {
    const func = inputFunc || clickFunc
    const obj = attrCollection.changeFuncsWithVModel[func] || {vModels: [], isCheckbox}
    // 判断重复值
    if (obj.vModels.indexOf(vModel) < 0) {
      vModel && obj.vModels.push(vModel)
    }
    attrCollection.changeFuncsWithVModel[func] = obj
  } else {
    if (vModel) {
      // 如果只有v-model，需要添加onchange事件
      const autoName = `_kyy_v_model_change_${vModel}`
      attrs.push({
        name: 'onchange',
        value: autoName
      })

      const isRepeat = attrCollection.vModels.find(item => item.dataName === vModel)
      if (!isRepeat) {
        attrCollection.vModels.push({
          dataName: vModel,
          changeFunc: autoName,
          isCheckbox
        })
      }
    }
  }
  return {
    attrs,
    extra: {
      isCheckbox
    }
  }
}
