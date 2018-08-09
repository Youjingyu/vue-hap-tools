const convertTpl = require('./convertTpl')
const convertStyle = require('./convertStyle')
const convertJs = require('./convertJs')
const commentDelete = require('./utils/comment-delete')
const compiler = require('vue-template-compiler')

module.exports = function (vueFile) {
  const block = compiler.parseComponent(vueFile)
  if (block.styles.length > 1) {
    throw new Error('一个vue模板只能有一个<style>标签')
  }
  let tplRes = {}
  // 写空标签会导致编译报错，因此无内容时，不能写空的style、script、template标签
  let tpl = ''
  if (block.template) {
    tplRes = convertTpl(commentDelete(block.template.content, 'html'))
    tpl = `<template>${tplRes.tpl}</template>`
  }

  let style = ''
  if (block.styles && block.styles.length > 0) {
    style = `<style>${convertStyle(commentDelete(block.styles[0].content, 'css'))}</style>`
  }

  let js = ''
  let components = ''
  if (block.script) {
    const jsResult = convertJs(commentDelete(block.script.content, 'js'), tplRes)
    js = `<script>\n${jsResult.jsString}\n</script>`

    components = jsResult.components.reduce((res, cur) => {
      return `${res}<import src="${cur.value}" name="${cur.name}"></import>\n`
    }, '')
  }

  return `${components}${tpl}\n${js}\n${style}`
}
