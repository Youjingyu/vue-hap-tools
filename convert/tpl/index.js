const { commentDelete } = require('../utils')
const preProcess = require('./pre-process')
const codeGen = require('./code-gen')
const globalId = require('./global-id')

module.exports = function (tpl, components) {
  tpl = commentDelete(tpl, 'tpl')
  globalId.reset()

  const { render, staticRenderFns, ast } = preProcess(tpl)

  return {
    ...codeGen(ast, components),
    render,
    staticRenderFns
  }
}
