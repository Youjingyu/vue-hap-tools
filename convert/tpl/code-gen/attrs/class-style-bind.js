const acorn = require('acorn')
const escodegen = require('escodegen')

function parseExpression (expression, type) {
  const ast = acorn.parse(`var a = ${expression}`, {sourceType: 'script'})
  const decla = ast.body[0].declarations[0].init
  let keyVals
  if (decla.type === 'ObjectExpression') {
    keyVals = parseObj(decla.properties)
  } else if (decla.type === 'ArrayExpression') {
    keyVals = parseArray(decla.elements)
  } else {
    return `{{${expression}}}`
  }
  return convertExpress(keyVals, type)
}

function parseObj (properties) {
  const res = []
  properties.forEach(prop => {
    res.push({
      key: prop.key.name || prop.key.value,
      val: getExpressionCode(prop.value)
    })
  })
  return res
}

function parseArray (elements) {
  let res = []
  elements.forEach((ele) => {
    const type = ele.type
    if (type === 'ObjectExpression') {
      res = res.concat(parseObj(ele.properties))
    } else {
      res.push({
        completedVal: getExpressionCode(ele)
      })
    }
  })
  return res
}

function getExpressionCode (propAst) {
  const declaAst = acorn.parse(`var a=1`, {sourceType: 'script'})
  declaAst.body[0].declarations[0].init = propAst
  return escodegen.generate(declaAst).replace('var a = ', '').replace(/;$/, '')
}

function convertExpress (keyVals, type) {
  if (type === 'class') {
    const res = []
    keyVals.forEach((keyVal) => {
      let { key, val, completedVal } = keyVal
      if (completedVal) {
        res.push(`{{${completedVal}}}`)
      } else {
        // 是否是表达式
        if (!/^[a-zA-Z\d_]+$/.test(val)) {
          val = `(${val})`
        }
        res.push(`{{${val}?'${key}':''}}`)
      }
    })
    return res.join(' ')
  }
  if (type === 'style') {
    const res = []
    let styles = ''
    keyVals.forEach((keyVal) => {
      let { key, val, completedVal } = keyVal
      if (completedVal) {
        res.push(`{{${completedVal}}}`)
      } else {
        styles += `${camelCaseToDash(key)}:{{${val}}};`
      }
    })
    return styles + res.join(';')
  }
}

function camelCaseToDash (str) {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
}

module.exports = function (attrs) {
  const { class: className = '', style = '' } = attrs
  const bindClass = attrs[':class'] || attrs['v-bind:class']
  const bindStyle = attrs[':style'] || attrs['v-bind:style']
  if (bindClass) {
    attrs.class = className + ' ' + parseExpression(bindClass, 'class')
    delete attrs[':class']
    delete attrs['v-bind:class']
  }
  if (bindStyle) {
    attrs.style = style + ';' + parseExpression(bindClass, 'style')
    delete attrs[':style']
    delete attrs['v-bind:style']
  }
  return attrs
}
