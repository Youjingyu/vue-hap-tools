const esprima = require("esprima");
const escodegen = require("escodegen");
const walk = require('./walk');

module.exports = function (jsString, tplRes) {
  const ast = esprima.parseModule(jsString);

  let components;
  let exportAstResult;
  let importDela = [];
  let otherCode = [];
  ast.body.forEach((item) => {
    if (item.type === 'ImportDeclaration') {
      importDela.push(item);
    } else if (item.type === 'ExportDefaultDeclaration') {
      exportAstResult = resolveExport(item, tplRes);
    } else {
      // 非import、export代码
      otherCode.push(item);
    }
  });

  components = exportAstResult.components;

  // 收集import的组件
  const indexToDelete = [];
  let componentsCollection = [];
  importDela.forEach((importItem, index) => {
    const importName = importItem.specifiers[0].local.name;
    const value = importItem.source.value;
    const componentName = getComponentesName(components, importName);
    if (componentName) {
      componentsCollection.push({
        name: componentName,
        value
      });
      indexToDelete.push(index);
    }
  });
  // 删除组件的import
  importDela = importDela.filter((cur, i) => {
    if (indexToDelete.indexOf(i) > -1) return false;
    return true;
  });
  // 如果使用了router，添加引入router的代码
  if(exportAstResult.routerInfo.$router){
    importDela.unshift(getImportAst("import _kyy_router from '@system.router'"));
  }
  // 拼接回ast
  ast.body = importDela.concat(otherCode).concat(exportAstResult.exportAst);
  // console.log(escodegen.generate(ast));
  return {
    jsString: escodegen.generate(ast),
    components: componentsCollection
  }
}


function getComponentesName(components, importName) {
  for (let item of components) {
    if (item.value === importName) {
      return item.name;
    }
  }
  return false;
}

function resolveExport(exportAst, tplRes) {
  let properties = exportAst && exportAst.declaration && exportAst.declaration.properties;
  if (!properties) return {
    components: [],
    exportAst
  };

  // 处理router
  const routerRes = resolveRouter(properties);
  properties = routerRes.properties;
  // 生命周期映射
  properties = resolveLifecycle(properties);

  let components = [];
  let methods = [];
  let computedRes = {
    computedFuncs: [],
    dataToInit: []
  };
  let watchRes = {
    props: [],
    watches: []
  }
  let onInitProp;
  let dataProp = [];
  let propToDeleteIndex = [];
  properties.forEach((prop, i) => {
    const name = prop.key.name;
    switch (name){
      case 'components':
        propToDeleteIndex.push(i);
        components = getComponents(prop);
      break;
      case 'methods':
        propToDeleteIndex.push(i);
        methods = prop.value.properties;
      break;
      case 'computed':
        propToDeleteIndex.push(i);
        computedRes = resolveComputed(prop);
      break;
      case 'watch':
        propToDeleteIndex.push(i);
        watchRes = resolveWatch(prop);
      break;
      case 'onInit':
        propToDeleteIndex.push(i);
        onInitProp = prop;
      break;
      case 'data':
        propToDeleteIndex.push(i);
        dataProp = prop;
      break;
    }
  });

  // 删除转换后多余的属性
  properties = properties.filter((cur, i) => {
    return propToDeleteIndex.indexOf(i) < 0;
  });

  // 转换onInit钩子（添加数据的watch；computed数据添加getter；如果使用了路由，将路由绑定到this.$router）
  properties.push(resolveOnInit(onInitProp, watchRes.watches, computedRes.computedFuncs, routerRes.routerInfo));
  // 将computed数据添加到data初始化
  properties.push(getDataAst(computedRes.dataToInit, dataProp));

  // 如果有input change事件的回调，需要特殊处理
  if(tplRes.attrCollection){
    methods = resolveChangeCallback(methods, tplRes.attrCollection);
  }

  // methods提取到外层、添加watch函数
  exportAst.declaration.properties = properties.concat(methods, watchRes.props);
  return {
    routerInfo: routerRes.routerInfo,
    components,
    exportAst
  }
}

// 处理生命周期
function resolveLifecycle(properties){
  const map = {
    'created': 'onInit',
    'mounted': 'onReady',
    'beforeDestroy':'onDestroy'
  }
  properties.forEach((prop)=>{
    const mapTo = map[prop.key.name];
    if(mapTo){
      prop.key.name = mapTo;
    }
  });
  return properties;
}

// 处理路由
function resolveRouter(properties){
  let has$Router = false, has$Route = false;
  let queryData = [];
  let $router, $route;

  walk.walkWithCondition(properties,  function(node, parent){
    $router = false, $route = false;
    if(node && node.type === 'MemberExpression' && node.object.type === 'MemberExpression' 
      && node.object.object.type === 'ThisExpression' ){
        $router = node.object.property.name === '$router';
        $route = node.object.property.name === '$route';
    }
    return $router || $route;
  }, function(node, parent){
    if($router){
      has$Router = true;      
      if(parent.type === 'CallExpression' && parent.arguments[0].type === 'ObjectExpression'){
        parent.arguments[0].properties.forEach(item =>{
          if(item.key.name === 'path'){
            // 将路由的path替换为uri
            item.key.name = 'uri';
          } else if(item.key.name === 'query'){
            // 将路由的path替换为uri
            item.key.name = 'params';
          }
        });
      }
    } else if($route){
      has$Route = true;
      if(parent.type === 'MemberExpression'){
        const name = parent.property.name;
        // 由于快应用会将路由传递的数据转为字符串
        // 将this.$route.query的使用数据parse回js变量
        if(queryData.indexOf(name) < 0){
          queryData.push(name);
        }
      }
    }
  });
  return {
    routerInfo: {
      $router: has$Router,
      $route: has$Route,
      queryData
    },
    properties
  };
}

// 获取vue声明的组件
function getComponents(prop) {
  const components = [];
  prop.value.properties.forEach((subProp) => {
    components.push({
      name: subProp.key.name || subProp.key.value,
      value: subProp.value.name
    });
  });
  return components;
}

// 处理vue中绑定的input事件，并处理v-model
function resolveChangeCallback(methods, attrCollection) {
  methods.forEach((method)=>{
    const changeFuncsWithVModel = attrCollection.changeFuncsWithVModel[method.key.name];
    if(changeFuncsWithVModel){
      const keyToPolyfill = changeFuncsWithVModel.isCheckbox ? 'checked' : 'value';
      // 如果函数没有参数，需要添加参数
      if(method.value.params.length === 0){
        method.value.params.push({"type": "Identifier", "name": "e"});
      }
      const paramName = method.value.params[0].name;
      // 在快应用中，e.target中没有value属性，这里添加value属性，兼容快应用
      // 即添加代码：e.target.value = e.value
      const assignAst = esprima.parseScript(`${paramName}.target.${keyToPolyfill}=${paramName}.${keyToPolyfill}`).body;
      let vModelAst = [];
      // 如果input既绑定了input事件，又绑定了v-model
      if(changeFuncsWithVModel.vModels.length > 0){
        vModelAst = getVModelAst(changeFuncsWithVModel.vModels, paramName, keyToPolyfill);
      }
      // 合并代码
      method.value.body.body = assignAst.concat(vModelAst).concat(method.value.body.body);
    }
  });
  // 只绑定了v-model，没有绑定input事件
  if(attrCollection.vModels && attrCollection.vModels.length > 0){
    // 手动添加事件回调，在回调中对监听的数据赋值
    attrCollection.vModels.forEach((item)=>{
      const keyToPolyfill = item.isCheckbox ? 'checked' : 'value';      
      const ast = getFuncAttrAst(item.changeFunc, 
        `e.target.${keyToPolyfill}=e.${keyToPolyfill};this.${item.dataName}=e.target.${keyToPolyfill};`, 'e');
      methods.push(ast);
    });
  }
  return methods;
}

function getVModelAst(vModels, e, keyToPolyfill){
  // 将v-model监听的数据，添加到change的回调函数处理
  const jsStr = vModels.reduce((total, dataName)=>{
    return total + `this.${dataName}=${e}.target.${keyToPolyfill};`
  }, '');
  return esprima.parseScript(jsStr).body
}

// 在onInit钩子中抹平router、computed、watch
function resolveOnInit(onInitAst, watches, computedFuncs, routerInfo){
  // 路由兼容代码
  const $routerCode = routerInfo.$router ? 'this.$router=_kyy_router;' : '';
  const $routeCode = routerInfo.$route ? 'this.$route={};this.$route.query=this;' : '';
  // 快应用会把数据转换为字符串
  // 为了能够在快应用中访问对象形式的数据，需要将字符串转换为js数据类型
  const queryDataRevertCode =  routerInfo.queryData.reduce((all, cur)=>{
    return all + `this.${cur}=new Function('return ' + this.${cur})();`
  }, '');

  // computed兼容代码
  const computedCode = computedFuncs.reduce((all, cur)=>{
    return all + `Object.defineProperty(this, '${cur.key}', {get:${cur.funcStr}});`
  }, '');
  // watch兼容代码
  const watchCode = watches.reduce((total, cur)=>{
    // 对于computed转换为的watch，初始化时需要执行一次watch回调函数，以完成数据初始化，从而表现和computed一致
    const autoExecute = cur.type === 'computed' ? `this.${cur.callback}();` : '';
    return total + `this.$watch('${cur.watchData}', '${cur.callback}');${autoExecute}`;
  }, '');

  const code = $routerCode + $routeCode + queryDataRevertCode + computedCode + watchCode

  // 如果已经定义了onInit钩子
  if(onInitAst){
    const watchAst = esprima.parseScript(code).body;
    onInitAst.value.body.body = watchAst.concat(onInitAst.value.body.body);
    return onInitAst
  } else{
    return getFuncAttrAst('onInit', code);
  }
}

// 用快应用的watch模拟computed
function resolveComputed(computedProp){
  // 提取conmputed的数据名，以及computed函数
  const dataToInit = [], computedFuncs = [];
  const prop = computedProp.value.properties;
  prop.forEach((item)=>{
    dataToInit.push(item.key.name);
    computedFuncs.push({
      key: item.key.name,
      funcStr: escodegen.generate(item.value) // 将computed方法转换为字符串，方便后续拼接
    });
  });
  return {
    dataToInit,
    computedFuncs
  }
}

// 将vue的watch转换为快应用的watch
function resolveWatch(watchProp){
  const res = {
    props: watchProp.value.properties,
    watches: []
  }
  res.props.forEach((item)=>{
    const name = item.key.name;
    const callbackName = `_kyy_watch_${name}`;
    item.key.name = callbackName;
    res.watches.push({
      watchData: name,
      callback: callbackName
    });
  });
  return res;
}

// 获取function属性的ast
function getFuncAttrAst(name, funcBodyStr, param){
  param = param || '';
  const temp = `var a={'${name}'(${param}){${funcBodyStr}}}`;
  return esprima.parseScript(temp).body[0].declarations[0].init.properties[0];
}

// 获取data属性的ast
function getDataAst(dataToInit, dataAst){
  if(!dataToInit || dataToInit.length === 0) return dataAst;

  const dataToInitAst = getdataToInitAst(dataToInit);
  if(dataAst){
    const dataToInitBody = dataToInitAst.value.body.body;
    const dataToInitReturnIndex = dataToInitBody.findIndex((item)=>{
      return item.type === 'ReturnStatement';
    });
    const dataToInitReturnProp = dataToInitBody[dataToInitReturnIndex].argument.properties;
    // 判断data是对象还是函数
    if(dataAst.value.type === 'ObjectExpression'){
      // 在return的值中添加数据
      dataToInitBody[dataToInitReturnIndex].argument.properties = dataToInitReturnProp.concat(dataAst.value.properties);
      return dataToInitAst;      
    } else {
      // 如果data本身就是函数，在原来基础上添加computed的数据
      const body = dataAst.value.body.body;    
      const returnIndex = body.findIndex((item)=>{
        return item.type === 'ReturnStatement';
      });
      body[returnIndex].argument.properties = body[returnIndex].argument.properties.concat(dataToInitReturnProp);
      return dataAst;
    }
  } else{
    return dataToInitAst;    
  }
}

function getdataToInitAst(data){
  const formate = data.map((cur)=>{
    // 每个compute的数据，默认值为空字符
    return `${cur}:''`
  });
  const temp = `var a={data(){return {${formate.join(',')}} }}`;
  return esprima.parseScript(temp).body[0].declarations[0].init.properties[0];
}

// 获取表达式的ast
function getImportAst(codeStr){
  return esprima.parseModule(codeStr).body[0];
}

// 获取嵌套深层的数据
function getDeepObjectData(dataObject, keyArr) {
  return keyArr.reduce(function (data, key) {
      return (data && data[key]) ? data[key] : undefined
  }, dataObject)
}