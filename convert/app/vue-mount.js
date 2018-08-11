const { getStatementAst } = require('../utils')

module.exports = function (vueDeclaName) {
  return getStatementAst(`
    ${vueDeclaName}.prototype.$mount = function () {
      ${vueDeclaName}.prototype._mountComponent(this)
    }
  `)
}
