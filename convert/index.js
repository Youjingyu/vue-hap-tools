const convertTpl = require('./convertTpl');
const convertStyle = require('./convertStyle');
const convertJs = require('./convertJs');
const commentDelete = require('./utils/comment-delete');
const compiler = require('vue-template-compiler');
const loaderUtils = require("loader-utils");

module.exports = function(source, options = {}) {
  this.cacheable && this.cacheable();

  const query = loaderUtils.parseQuery(this.query);  
  const convertAll =  options.convertAll || query.type === 'component';
  const block = compiler.parseComponent(source);
  if (block.styles.length > 1) {
    throw new Error('一个vue模板只能有一个<style>标签');
  }
  let tplRes = {};
  // 写空标签会导致编译报错，因此无内容时，不能写空的style、script、template标签
  let tpl = '';
  if(block.template && (convertAll || query.type === 'templates' || query.type === 'scripts')){
    tplRes = convertTpl(commentDelete(block.template.content, 'html'));
    tpl = `<template>${tplRes.tpl}</template>`
  }

  let style = '';
  if(block.styles && block.styles.length > 0 && (convertAll || query.type === 'styles')){
    style = `<style>${convertStyle(commentDelete(block.styles[0].content, 'css'))}</style>`
  }

  let js = '';
  let components = '';
  if(block.script && (convertAll || query.type === 'scripts')){
    const jsResult = convertJs(commentDelete(block.script.content, 'js'), tplRes);
    js = `<script>${jsResult.jsString}</script>`;

    components = jsResult.components.reduce((res, cur)=>{
      return `${res}<import src="${cur.value}" name="${cur.name}"></import>`
    }, '');
  }

  return `${components}${tpl}${js}${style}`;
}
