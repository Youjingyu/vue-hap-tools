var util = require('util')
var parse = require('parse5');

var HtmlTag = function() {
  return ('html,body,base,head,link,meta,style,title,' +
    'address,article,aside,footer,header,h1,h2,h3,h4,h5,h6,hgroup,nav,section,' +
    'div,dd,dl,dt,figcaption,figure,hr,img,li,main,ol,p,pre,ul,' +
    'a,b,abbr,bdi,bdo,br,cite,code,data,dfn,em,i,kbd,mark,q,rp,rt,rtc,ruby,' +
    's,samp,small,span,strong,sub,sup,time,u,var,wbr,area,audio,map,track,video,' +
    'embed,object,param,source,canvas,script,noscript,del,ins,' +
    'caption,col,colgroup,table,thead,tbody,td,th,tr,' +
    'button,datalist,fieldset,form,input,label,legend,meter,optgroup,option,' +
    'output,progress,select,textarea,' +
    'details,dialog,menu,menuitem,summary,' +
    'content,element,shadow,template' +
    'svg,animate,circle,clippath,cursor,defs,desc,ellipse,filter,font-face,' +
    'foreignObject,g,glyph,image,line,marker,mask,missing-glyph,path,pattern,' +
    'polygon,polyline,rect,switch,symbol,text,textpath,tspan,use,view').split(',');
}();

var tagConvertMap = function() {
  //text 不能套text
  //span 必须在text里
  var map = {
    'div': 'aside,footer,header,h1,h2,h3,h4,h5,h6,nav,section,figcaption,figure,' +
      'dd,dl,dt,p,main,ul,ol,li,' +
      'table,thead,tbody,td,th,tr,' +
      'fieldset,legend,article',
      // 列表不再转为list组件
    // 'list': 'ul,ol,
    // 'list-item': 'li',  
    'block': 'template',
    'progress': 'progress',
    'text': 'span,strong,i,sub,sup,time,u,var,b,abbr,cite,code,em,q,address,pre,del,ins',
    'a': 'a,router-link',
    'label': 'label',
    'textarea': 'textarea',
    'input': 'input,button',
    'image': 'img',
    'video': 'video'
  };
  var newmaps = {};
  Object.keys(map).forEach((key) => {
    var item = map[key];
    item.split(',').forEach((newkey) => {
      newmaps[newkey] = key;
    });
  });
  return newmaps;
}();

var notSupportTag = HtmlTag.filter((item) => {
  return !tagConvertMap[item];
});

function convertExpress(val) {
  return '{{' + val + '}}'
}

var attrsConvert = {
  'v-for': {
    attr: 'for',
    val: function(val){
      return val.replace(/\((.+),[]*(.+)\)/, "($2,$1)");
    }
  },
  'v-if': {
    attr: 'if',
    val: convertExpress
  },
  'v-else-if': {
    attr: 'else-if',
    val: convertExpress
  },
  'v-else': {
    attr: 'else'
  },
  'v-show': {
    attr: 'show',
    val: convertExpress
  },
  '^(:|v-bind:)(.*?)$': {
    attr: function(name, regs) {
      return regs[2];
    },
    val: function(val, regs, staticValue) {
      //处理style的写法
      // if (type === 'style') {
      //   return val.replace(/('|{|})/g, '');
      // }
      val = convertObjProp(val, regs[2]);
      var staticStr = '';
      // 将bind的属性和静态属性合并，如:class和class
      if(staticValue){
        // 将字符串用{{}}包裹，使hp-tools将其识别为变量
        staticStr = staticValue.trim().split(/[ ]+/).reduce((total, cur)=>{
          return total + ' ' + convertExpress(`'${cur}'`);
        }, '');
      }
      return val + staticStr;
    }
  },
  '^(@|v-on:)(.*?)$': {
    attr: function(name, regs) {
      // 将输入框的input事件转为快应用的change事件
      var type = regs[2] === 'input' ? 'change' : regs[2];
      return 'on' + type;
    }
  },
  'v-model': {
    attr: function(name, regs, extra){
      return extra.isCheckbox ? 'checked' : 'value';
    },
    val: function(val){
      return convertExpress(val);
    }
  }
};

function process(ast) {
  if (ast.content) {
    ast.childNodes = ast.content.childNodes;
  }
  var childs = ast.childNodes;
  if (childs) {
    childs.forEach((item) => {
      item.attrs = item.attrs || [];
      // button需要转为type为button的input
      if(item.tagName === 'button'){
        item.attrs.push({
          name: 'type',
          value: 'button'
        });
        // 快应用中button的文本需要写为value值
        if(item.childNodes && item.childNodes[0]){
          item.attrs.push({
            name: 'value',
            value: item.childNodes[0].value
          });
        }
      }

      //替换tag
      var ctag = tagConvertMap[item.tagName];
      if (ctag) {
        item.tagName = item.nodeName = ctag;
      }

      var attrToDeleteIndex = [];
      // 先收集attr中的部分信息，并做处理
      const attrRes = collectAttr(item.attrs);
      item.attrs = attrRes.attrs;
      //替换attrs
      item.attrs.forEach((attr, index) => {
        var atrname = attr.name,
          atrval = attr.value;
        for (var key in attrsConvert) {
          var atrc = attrsConvert[key];
          var isIn = atrname.match(new RegExp(key));
          if (isIn) {
            var name = typeof atrc.attr === 'string' ? atrc.attr : atrc.attr(atrname, isIn, attrRes.extra);
            // 在vue中可以这样写：<input class="active" :class="normal">
            // 需要合并这两个属性       
            var repeatAttr = findAttr(item.attrs, name);
            var staticValue;
            if(repeatAttr){
              attrToDeleteIndex.push(repeatAttr.index);
              staticValue = repeatAttr.attr.value;              
            }
            var value = atrc.val ? atrc.val(atrval, isIn, staticValue) : atrval;
            item.attrs[index].name = name;
            item.attrs[index].value = value;
          }
        }

        // 特殊处理
        if(attr.name === "key"){
          // 快应用不支持key属性          
          attrToDeleteIndex.push(index);
        } else if(attr.name === 'for' && item.tagName === 'label'){
          // label的for属性需要转换为target
          item.attrs[index].name = 'target';
        } else if(attr.name === 'to' && item.tagName === 'a'){
          // router-link标签的to属性转换为href属性
          item.attrs[index].name = 'href';      
        }
      });
      // 删除重复的属性
      // 比如:class、class两个属性转换后会重复
      item.attrs = item.attrs.filter((cur, index)=>{
        return attrToDeleteIndex.indexOf(index) < 0
      });
      // 列表不再转为list组件
      // 为转换后的list-item添加type属性
      // if(item.tagName === 'list-item'){
      //   var hasTypeProp = item.attrs && findAttr(item.attrs, 'type');
      //   if(!hasTypeProp){
      //     var typeProp = {
      //       name: 'type', 
      //       value: 'kyy-normal-list'
      //     };
      //     item.attrs.push(typeProp);
      //   }
      // }

      // 转换后，如果如果出现text嵌套text，将子节点修改为span              
      if(item.tagName === 'text' && ast.tagName === 'text'){
        item.tagName = item.nodeName = 'span';
      }
      process(item);
    });
  }
  return ast;
}

function findAttr(attrs, name){
  for(let i = 0; i < attrs.length; i++){
    if(attrs[i].name === name){
      return {
        attr: attrs[i],
        index: i
      }
    }
  }
}

function convertObjProp(prop, type){
  // 转换对象形式的class
  if(type === 'class' && /^{.+?}$/.test(prop)){
    // 删除对象前后的括号，删除单引号
    let keyValPair = prop.replace(/^([ ]*{)|(}[ ]*)$/g, '').split(',');
    keyValPair = keyValPair.map((item)=>{
      // 去除空格，hap-tools会以空格拆分表达式
      item = item.replace(/[ ]+/g, '');
      const keyVal = item.split(':');
      // 如果class名有单引号，先去除单引号
      const key = keyVal.shift().replace(/'/g, '');
      // 处理有三元表达式的情况      
      const value = keyVal.join(':');
      // 将对象形式的class转为三元表达式
      return convertExpress(`${value}?'${key}':''`);
    });
    return keyValPair.join(' ');
  } else {
    return convertExpress(prop);
  }
}

let attrCollection;
function collectAttr(attrs){
  let inputFunc, vModel, isCheckbox = false, clickFunc;
  let clickAttrIndex = undefined;
  attrs.forEach((attr, i)=>{
    // input事件的回调函数需要在转换js时，特殊处理
    if(/^(@|v-on:)(input)$/.test(attr.name)){
      inputFunc = attr.value;
    } else if(attr.name === 'v-model'){
      vModel = attr.value
    } else if(attr.name === 'type' && (attr.value === 'checkbox' || attr.value === 'radio')){
      isCheckbox = true;
    } else if(/^(@|v-on:)(click)$/.test(attr.name)){
      clickFunc = attr.value;
      clickAttrIndex = i;
    }
  });

  // 将CheckBox的click事件替换为onchange事件
  if(isCheckbox && clickFunc){
    attrs[clickAttrIndex].name = 'onchange';
  }

  // 具有input事件或者是有click事件的checkbox或者radio
  if(inputFunc || (isCheckbox && clickFunc)){
    const func = inputFunc || clickFunc;
    const obj = attrCollection.changeFuncsWithVModel[func] || {vModels: [], isCheckbox};
    // 判断重复值
    if(obj.vModels.indexOf(vModel) < 0){
      vModel && obj.vModels.push(vModel);
    }
    attrCollection.changeFuncsWithVModel[func] = obj;
  } else {
    if(vModel){
      // 如果只有v-model，需要添加onchange事件      
      const autoName = `_kyy_v_model_change_${vModel}`;
      attrs.push({
        name: 'onchange',
        value: autoName
      });

      const isRepeat = attrCollection.vModels.find(item => item.dataName === vModel);
      if(!isRepeat){
        attrCollection.vModels.push({
          dataName: vModel,
          changeFunc: autoName,
          isCheckbox
        })
      }
    }
  }
  return {
    attrs,
    extra: {
      isCheckbox
    }
  };
}

module.exports = function(tpl) {
  attrCollection = {
    // 收集input事件的回调函数名（input事件会转为change事件），并将v-model值保存
    // 当绑定了input事件时，v-model的值保存在changeFuncs中
    changeFuncsWithVModel: {},
    // 如果没有绑定input事件，但有v-model，v-model的值保存在vModel中
    vModels: []
  };

  var ast = parse.parseFragment(tpl, {
    treeAdapter: parse.treeAdapters.default,
    locationInfo: true
  });
  ast = process(ast);
  var newtpl = parse.serialize(ast);
  return {
    tpl: newtpl,
    attrCollection
  };
}
module.exports.tagConvertMap = tagConvertMap;
