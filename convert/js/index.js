const esprima = require('esprima')
const escodegen = require('escodegen')
const codeParse = require('./code-parse')
const codeGen = require('./code-gen')
const { commentDelete } = require('../utils')

module.exports = function (jsString, waitTpl) {
  jsString = commentDelete(jsString)

  if (!waitTpl) return jsString

  const ast = esprima.parseModule(jsString)

  const codeParseRes = codeParse(ast.body)
  return new Promise((resolve) => {
    waitTpl({components: codeParseRes.components}, (tplRes) => {
      const codeGenRes = codeGen(codeParseRes, tplRes)
      ast.body = codeGenRes
      resolve(escodegen.generate(ast, {
        format: {
          indent: {
            style: '  '
          }
        }
      }))
    })
  })
}

function preProcess (jsString) {
  return commentDelete(jsString)
}

module.exports = {
  preProcess,
  codeParse (jsString) {
    const ast = esprima.parseModule(preProcess(jsString))
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
