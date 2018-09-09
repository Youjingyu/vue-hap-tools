const acorn = require('acorn')
const escodegen = require('escodegen')
const transpile = require('vue-template-es2015-compiler')
const codeParse = require('./code-parse')
const codeGen = require('./code-gen')
const { commentDelete } = require('../utils')

function preProcess (jsString) {
  return commentDelete(jsString)
}

function toFunction (code) {
  code = transpile(`function render(){${code}}`)
  code = code.replace(/^function render/, 'function')
  return code
}

module.exports = {
  preProcess,
  codeParse (jsString) {
    const ast = acorn.parse(preProcess(jsString), {
      ecmaVersion: 10,
      sourceType: 'module'
    })
    return {
      res: codeParse(ast.body),
      ast
    }
  },
  codeGen (codeParseRes, tplRes) {
    const { res, ast } = codeParseRes
    const { render, staticRenderFns, extra } = tplRes
    // 去除with语句
    let transpiledRender = toFunction(render)
    let transpiledStaticRenderFns = staticRenderFns.map(toFunction).join(',')
    const codeGenRes = codeGen(res, extra)
    ast.body = codeGenRes
    const code = escodegen.generate(ast, {
      format: {
        indent: {
          style: '  '
        }
      }
    })
    return code.replace('const _qa_vue_options = {', `const _qa_vue_options = {\n  render:${transpiledRender},\n  staticRenderFns:[${transpiledStaticRenderFns}],`)
  }
}
