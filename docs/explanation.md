# 框架原理说明
vue-hap-tools在hap-toolkit编译之前进行转换，将转换结果传给hap-toolkit。
### 整体编译过程
简化的编译流程如下图所示：  
![流程图](https://github.com/Youjingyu/vue-hap-tools/raw/master/docs/flow-chart.png)   
编译从```webpack --config ./webpack.config.js```命令开始。webpack.config.js会通过manifest.json解析主入口及各个页面入口，将多个入口加入webpack的entry，最后将配置抛给webpack执行打包。  
vue后缀的文件都会走我们的loader。loader中首先通过loader.js将主入口和页面入口分发到app-loader.js、page-loader.js，page-loader.js解析之前，先调用convert转换原始vue文件，再将页面拆分为组件、template、script、style，然后根据每个部分的内容拼接出用于解析各个部分的loader（形如```require('!!../../fragment-loader.js!./index.vue')```），拿到loader后，我们再在每个loader末尾加上我们的convert loader，保证每种类型的模块都首先经过我们的loader转换再往后继续编译，最后返回最终的loader。webpack拿到loader后，会根据loader继续编译。下面是一个vue文件转换出的loader示例：
```javascript
var $app_template$ = require('!!./json-loader.js!./template-loader.js!./fragment-loader.js?index=0&type=templates!./convert/index.js?type=templates!./index.vue');
var $app_style$ = require('!!./json-loader.js!./style-loader.js?index=0&type=styles!./fragment-loader.js?index=0&type=styles!./convert/index.js?type=styles!./index.vue');
var $app_script$ = require('!!./script-loader.js!babel-loader?presets[]=./node_modules/babel-preset-env&presets=./babel-preset-env&plugins[]=./lib/jsx-loader.js&plugins=./lib/jsx-loader.js&comments=false!./access-loader.js!./fragment-loader.js?index=0&type=scripts!./convert/index.js?type=scripts!./index.vue?isEntry=true');
```
上面的例子中，index.vue从右到左依次在各个loader间流转。
### 模板转换
- 标签转换、属性转换
- 特异性处理对象形式的class
- 合并表达式属性和静态属性，如:class和class
- 删除快应用不支持的属性
- 处理input和checkbox的v-model，并将结果传出供js转换时使用
### JS转换
js分为import代码、export代码、其他代码三部分
- 从export的components部分收集引入的组件名，并结合import部分匹配出组件的路径，最后抛出```{ 组件名: 组件路径 }```，外部拿到结果≈后转换为快应用中的组件引入方式。
- 如果使用了vue-router，引入快应用的router，并在this上挂载router
- 使用Object.defineProperty实现转换computed
- 使用快应用的$watch转化watch
- 特殊处理input change事件的回调函数
- 实现v-model
- 生命周期映射
### css转换
hap-toolkit内部递归处理css，没有走webpack，因此css转换介入了hap-toolkit的内部逻辑
- 将rem转换为px
- 处理选择器
### 其他
#### 根据注释删除特异性代码
首先在我们的loader中执行删除，但是import的css和js不能通过这个方式删除。  
import的css在css转换时统一删除。import的js通过在webpack.config.js的js loader部分添加一个js预处理loader实现统一删除。
#### 输出二维码的dev
在hap-toolkit中，需要先执行watch命令，再执行server命令输出二维码。在vue-hap-tools中，在一个dev命令中，先执行watch，编译完成后，再输出二维码，避免输出的日志将二维码挤出屏幕。