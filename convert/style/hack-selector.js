const csswhat = require('css-what')
const {
  cssStringify,
  logger
} = require('../utils')
const tagConvertMap = require('../tpl/tag-map')

module.exports = function (selectors) {
  const res = []
  selectors.forEach((selector) => {
    const selArr = csswhat(selector)
    selArr.forEach(sels => {
      sels.forEach((sel, i) => {
        // tag类型的选择器，且tag被转换了
        if (sel.type === 'tag' && tagConvertMap[sel.name] && tagConvertMap[sel.name] !== sel.name) {
          // span标签特异性处理
          if (sel.name === 'span') {
            // 如果span选择器的前面是text选择器
            // 因为span嵌套会转换为<text><span></span></text>结构
            // 提出警告，不做转换
            if (sels[i - 2] && sels[i - 2].name === 'text') {
              logger.warn('因为在template中，span的直接父级span标签会转为text标签；因此后代选择器 span span 转换为 text span；请保证标签嵌套结构')
            } else {
              // 无嵌套，直接修改为text
              sel.name = 'text'
            }
          } else {
            // 非span标签警告
            logger.warn(`快应用不支持 ${sel.name} 标签，标签选择器 ${sel.name} 无效，请使用class选择器`)
          }
        }
      })
    })
    res.push(cssStringify(selArr))
  })
  return res
}
