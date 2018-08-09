const htmlCommentReg = new RegExp('<!--' + '\\s*quick\\s*app\\s*ignore\\s*start\\s*' + '-->' +
  '(.|\\r|\\n)*?' +
  '<!--' + '\\s*quick\\s*app\\s*ignore\\s*end\\s*' + '-->', 'g')
const cssJsCommentReg = new RegExp('/\\*' + '\\s*quick\\s*app\\s*ignore\\s*start\\s*' + '\\*/' +
  '(.|\\r|\\n)*?' +
  '/\\*' + '\\s*quick\\s*app\\s*ignore\\s*end\\s*' + '\\*/', 'g')

// 根据约定删除代码
module.exports = function (codeStr, type) {
  if (type === 'js' || type === 'css') {
    return codeStr.replace(cssJsCommentReg, '')
  }
  if (type === 'html') {
    return codeStr.replace(htmlCommentReg, '')
  }
  return codeStr.replace(cssJsCommentReg, '').replace(htmlCommentReg, '')
}
