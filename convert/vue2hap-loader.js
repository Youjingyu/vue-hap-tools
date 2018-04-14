const compiler = require('vue-template-compiler');
const esprima = require('esprima');
const escodegen = require("escodegen");
const walk = require('./walk');
const path = require('path');

module.exports = function(source) {
  var ast = esprima.parse(source);
  walk(ast, (node) => {
    var raw;
    if (node.type === 'VariableDeclarator' && node.init.callee.name === 'require') {
      raw = node.init.arguments[0].raw;
      node.init.arguments[0].raw = node.init.arguments[0].value = fixRaw(raw);
    } else if(node.type === 'ExpressionStatement' && node.expression.callee && node.expression.callee.name === 'require'){
      raw = node.expression.arguments[0].raw;
      node.expression.arguments[0].raw = node.expression.arguments[0].value = fixRaw(raw);
    }
  });

  var jstpl = escodegen.generate(ast);
  // console.log(jstpl);
  return jstpl;
};

function fixRaw(raw){
  const convertPath = path.resolve(__dirname, 'index.js');
  var type = (/type=(.*?)!/).exec(raw)[1];
  var newraw = '!!';
  raw.slice(3).split('!').forEach((item, index, arr) => {
    var isLast = (index === arr.length - 1);
    if (isLast) {
      newraw += convertPath + '?type=' + type + '!';
    }
    newraw += item + (isLast ? '' : '!');
  });
  newraw = newraw.slice(0,-1);
  return newraw;
}
