require('./self-close-tag')
const parse = require('parse5')
const { commentDelete } = require('../utils')
const process = require('./process')

module.exports = function (tpl, codeParseRes = {}) {
  tpl = commentDelete(tpl)

  let ast = parse.parseFragment(tpl, {
    treeAdapter: parse.treeAdapters.default,
    locationInfo: true
  })
  const processRes = process(ast, codeParseRes.components || [])
  return {
    tpl: parse.serialize(processRes.ast),
    codeGen: processRes.codeGen
  }
}
