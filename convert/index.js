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
    tplRes = convertTpl(block.template.content, codeParseRes && codeParseRes.res && codeParseRes.res.components)
    tpl = `<template>\n${tplRes.tpl}\n</template>`
  }

  let js = ''
  let components = ''
  if (codeParseRes) {
    js = `<script>\n${codeGen(codeParseRes, tplRes)}\n</script>`
    components = codeParseRes.res.components.reduce((res, cur) => {
      return `${res}<import src="${cur.value}" name="${cur.name}"></import>\n`
    }, '')
  }

  let style = ''
  if (block.styles && block.styles.length > 0) {
    style = block.styles.map(styleElement => {
      const attrs = styleElement.attrs
      let strAttrs = Object.keys(attrs).map(key => {
        return typeof attrs[key] === 'boolean' && attrs[key] ? key : `${key}="${attrs[key]}"`
      }).join(' ')
      if (strAttrs.trim()) {
        strAttrs = ' ' + strAttrs
      }
      return `<style${strAttrs}>\n${convertStyle(styleElement.content)}\n</style>`
    }).join('\n')
  }

  return `${components}${tpl}\n${js}\n${style}`
}
