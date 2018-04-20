const commentDelete = require('../utils/comment-delete');

module.exports = function (jsStr) {
  this.cacheable && this.cacheable();

  return commentDelete(jsStr, 'js');
}
