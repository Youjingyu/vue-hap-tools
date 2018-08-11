const esprima = require('esprima')
const escodegen = require('escodegen')
const codeParse = require('./code-parse')
const codeGen = require('./code-gen')
const { commentDelete } = require('../utils')

module.exports = function (jsString, tplRes, isJsFile) {
  jsString = commentDelete(jsString)

  if (isJsFile) return jsString

  const ast = esprima.parseModule(jsString)

  const codeParseRes = codeParse(ast.body, tplRes)
  const codeGenRes = codeGen(codeParseRes)

  ast.body = codeGenRes
  // console.log(escodegen.generate(ast));
  return {
    jsString: escodegen.generate(ast, {
      format: {
        indent: {
          style: '  '
        }
      }
    }),
    components: codeParseRes.components
  }
}
