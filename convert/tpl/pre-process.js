const compiler = require('vue-template-compiler')
const globalId = require('./global-id')

module.exports = function (tpl) {
  const res = compiler.compile(tpl, {
    preserveWhitespace: false,
    modules: [{
      transformNode (ast) {
        const { for: vFor, iterator1 } = ast
        if (vFor && !iterator1) {
          ast.iterator1 = 'i'
        }

        return ast
      },
      postTransformNode (ast, code) {
        const { events, directives = [], attrs = [] } = ast
        const hasVModel = directives.findIndex((directive) => {
          return directive.name === 'model'
        }) > -1
        if (events || hasVModel) {
          let iterator1 = getIterator1(ast)
          iterator1 = iterator1 ? `${iterator1} + '-' + ` : ''
          attrs.push({
            name: 'data-eventid',
            value: `${iterator1}'${globalId.get()}'`
          })
          ast.attrs = attrs
        }
      }
    }]
  })
  return res
}

function getIterator1 (ast) {
  if (ast.iterator1) {
    return ast.iterator1
  }
  if (ast.parent) {
    return getIterator1(ast.parent)
  }
}
