const acorn = require('acorn')
const escodegen = require('escodegen')
const codeParse = require('./code-parse')
const codeGen = require('./code-gen')
const { commentDelete } = require('../utils')

function preProcess (jsString) {
  return commentDelete(jsString)
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
    const codeGenRes = codeGen(res, tplRes)
    ast.body = codeGenRes
    return escodegen.generate(ast, {
      format: {
        indent: {
          style: '  '
        }
      }
    })
  }
}
