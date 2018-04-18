const csswhat = require('css-what');
const stringfy = require('./utils/css-what-stringfy');
const tagConvertMap = require('./convertTpl.js').tagConvertMap;
const utils = require("../lib/utils");

const hackStyle = {
  hackSelector: function(selector){
    const selArr = csswhat(selector);
    const logs = [];
    selArr.forEach((sels => {
      sels.forEach((sel, i) => {
        // tag类型的选择器，且tag被转换了
        if(sel.type === 'tag' && tagConvertMap[sel.name] && tagConvertMap[sel.name] !== sel.name){
          // span标签特异性处理
          if(sel.name === 'span'){
            // 如果span选择器的前面是text选择器
            // 因为span嵌套会转换为<text><span></span></text>结构
            // 提出警告，不做转换
            if(sels[i - 2] && sels[i - 2].name === 'text'){
              logs.push('因为在HTML中，嵌套span中的父级span标签会转为text组件；span span 后代选择器转换为 text span；请保证HTML结构');
            } else {
              // 无嵌套，直接修改为text
              sel.name = 'text';
            }
          } else{
            // 非span标签警告
            logs.push(`快应用不支持 ${sel.name} 标签，标签选择器 ${sel.name} 无效，请使用class选择器`);
          }
        }
      })
    }));
    return {
      selector: stringfy(selArr),
      log: logs.join('; ')
    };
  },
  convertRem: function(styleVal){
    if (/([0-9]+)\.?([0-9]*)\s*rem/.test(styleVal)) {
      styleVal = styleVal.split(/\s+/).map(item => {
        return parseFloat(item, 10) * 100 + 'px';
      }).join(' ');
    }
    return styleVal;
  }
}
module.exports = hackStyle;