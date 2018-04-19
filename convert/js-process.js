const commentDelete =  require('./utils/comment-delete');

module.exports = function(jsStr){
  return commentDelete(jsStr, 'js');
}