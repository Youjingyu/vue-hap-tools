const tagConvertMap = require('./tag-map')
const convertAttrs = require('./attrs')

function generate (ast, components, extra = {}, indent = '') {
  let { tag, attrsMap = {}, children = [], text } = ast
  if (!tag) return {tpl: indent + text, extra}
  // 特殊处理button
  if (tag === 'button') {
    attrsMap.type = 'button'
    if (children.length === 1 && children[0].type === 3) {
      attrsMap.value = children[0].text || ''
      // button的子文本节点，不再处理
      children = []
    }
  }
  // input默认为text类型
  if (tag === 'input' && !attrsMap['type']) {
    attrsMap['type'] = 'text'
  }
  let childTpl = ''
  if (children && children.length) {
    // 递归子节点
    childTpl = children.map((child) => {
      const childRes = generate(child, components, extra, indent + '  ')
      return childRes.tpl
    }).join('\n')
  }
  tag = tagConvertMap[tag] || tag
  const attrsRes = convertAttrs(attrsMap, ast, components)
  extra = mergeExtra(extra, attrsRes.extra)
  const attrsString = Object.keys(attrsRes.attrs).map((key) => {
    const value = attrsRes.attrs[key]
    return (value === '' || typeof value === 'undefined') ? key : `${key}="${value}"`
  }).join(' ')
  let tpl = ''
  // 进行一定的format
  if (childTpl === '') {
    tpl = `${indent}<${tag} ${attrsString}></${tag}>`
  } else {
    tpl = `${indent}<${tag} ${attrsString}>${childTpl === '' ? '' : '\n' + childTpl + '\n'}${indent}</${tag}>`
  }
  return {
    tpl,
    extra
  }
}

module.exports = generate

function mergeExtra (extra, newExtra) {
  Object.keys(newExtra).forEach(key => {
    extra[key] = newExtra[key].concat(extra[key] || [])
  })
  return extra
}
