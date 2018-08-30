const convertTpl = require('./tpl')
const convertStyle = require('./style')
const { codeParse, codeGen } = require('./js')
const compiler = require('vue-template-compiler')

module.exports = function (vueFile) {
  const block = compiler.parseComponent(vueFile)
  if (block.styles.length > 1) {
    throw new Error('一个vue模板只能有一个<style>标签')
  }

  let codeParseRes
  if (block.script) {
    codeParseRes = codeParse(block.script.content)
  }

  let tplRes
  // 写空标签会导致编译报错，因此无内容时，不能写空的style、script、template标签
  let tpl = ''
  if (block.template) {
    tplRes = convertTpl(block.template.content, codeParseRes && codeParseRes.res)
    tpl = `<template>${tplRes.tpl}</template>`
  }

  let js = ''
  let components = ''
  if (codeParseRes) {
    js = `<script>\n${codeGen(codeParseRes, tplRes.codeGen)}\n</script>`
    components = codeParseRes.res.components.reduce((res, cur) => {
      return `${res}<import src="${cur.value}" name="${cur.name}"></import>\n`
    }, '')
  }

  let style = ''
  if (block.styles && block.styles.length > 0) {
    style = `<style>\n${convertStyle(block.styles[0].content)}\n</style>`
  }

  return `${components}${tpl}\n${js}\n${style}`
}
