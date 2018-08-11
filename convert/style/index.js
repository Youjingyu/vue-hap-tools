const css = require('css')
const hackSelector = require('./hack-selector')
const rem2px = require('./rem-to-px')

module.exports = function (styleString) {
  const imports = []
  styleString = styleString.replace(/@import\s+((?:['"]([^()]+?)['"])|(?:(?:url\(([^()]+?)\))))\s*;/g, (imp) => {
    imports.push(imp)
    return ''
  })

  const ast = css.parse(styleString, { silent: false })
  ast.stylesheet && ast.stylesheet.rules.forEach((rule, index) => {
    if (rule.type === 'rule') {
      rule.selectors = hackSelector(rule.selectors)
      rule.declarations.forEach((declaration) => {
        if (declaration.type === 'declaration') {
          declaration.value = rem2px(declaration.value)
        }
      })
    }
  })
  return imports.join('\n') + '\n' + css.stringify(ast)
}
