const { commentDelete } = require('../utils')

module.exports = function (jsStr) {
  this.cacheable && this.cacheable()

  return commentDelete(jsStr, 'js')
}
