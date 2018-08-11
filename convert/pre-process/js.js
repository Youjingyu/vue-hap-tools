const { commentDelete } = require('../utils')

module.exports = function (jsStr) {
  return commentDelete(jsStr, 'js')
}
