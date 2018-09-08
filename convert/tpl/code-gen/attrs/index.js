const convert = require('./convert')
const convertClassStyleBind = require('./class-style-bind')

module.exports = function (attrs, ast, components) {
  const allExtra = {
    refs: [],
    customEventCb: []
  }
  const { tag, directives = [] } = ast
  // 优先处理class、style
  attrs = convertClassStyleBind(attrs)
  Object.keys(attrs).forEach(attrName => {
    for (let key in convert) {
      const matches = attrName.match(new RegExp(key))
      if (matches) {
        const res = convert[key](attrs[attrName], ast, matches, components)
        delete attrs[attrName]
        const { name, value, extra = {} } = res
        attrs[name] = value
        const { customEventCb, ref } = extra
        if (customEventCb) allExtra.customEventCb.push(customEventCb)
        if (ref) allExtra.refs.push(extra.ref)
        break
      }
    }
  })
  // 如果有vModel，没有change事件，自动添加
  const hasVModel = directives.findIndex((direc) => {
    return direc.name === 'model'
  }) > -1
  if (hasVModel && !attrs['onchange']) {
    const eventId = ast.attrs.find((attr) => {
      return attr.name === 'data-eventid'
    })
    attrs['onchange'] = `_qa_proxy({id:${eventId.value}})`
  }
  // 特殊处理
  // 快应用不支持key属性
  delete attrs['key']
  if (tag === 'label' && attrs['for']) {
    // label的for属性需要转换为target
    attrs['target'] = attrs['for']
    delete attrs['for']
  }
  if (tag === 'a' && attrs['to']) {
    // router-link标签的to属性转换为href属性
    attrs['href'] = attrs['to']
    delete attrs['to']
  }
  // 转换后，如果如果出现text嵌套text，将子节点修改为span
  if (tag === 'text' && ast.parent && ast.parent.tag === 'text') {
    ast.tag = 'span'
  }
  return {
    attrs,
    extra: allExtra
  }
}
