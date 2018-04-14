const convertTpl = require('./convertTpl');
const convertStyle = require('./convertStyle');
const convertJs = require('./convertJs');
const compiler = require('vue-template-compiler');
const loaderUtils = require("loader-utils");

module.exports = function(source) {
  this.cacheable && this.cacheable();
  const block = compiler.parseComponent(source);
  if (block.styles.length > 1) {
    throw new Error('一个vue模板只能有一个<style>标签');
  }
  let tplRes = {};
  // 写空标签会导致编译报错，因此无内容是，不能写空的style、script、template
  let tpl = '';
  if(block.template){
    tplRes = convertTpl(block.template.content);
    tpl = `<template>${tplRes.tpl}</template>`
  }
  let style = block.styles.length ? `<style>${convertStyle(block.styles[0].content)}</style>` : '';
  let js = '';
  let components = '';
  if(block.script){
    const jsResult = convertJs(block.script.content, tplRes);
    js = `<script>${jsResult.jsString}</script>`;

    components = jsResult.components.reduce((res, cur)=>{
      return `${res}<import src="${cur.value}" name="${cur.name}"></import>`
    }, '');
  }
  return `${components}${tpl}${js}${style}`;
}

