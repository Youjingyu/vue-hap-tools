# 框架原理说明
vue-hap-tools 在hap-toolkit 编译之前进行转换，将转换结果传给 hap-toolkit。
### 整体编译过程
简化的编译流程如下图所示：  
![流程图](https://user-images.githubusercontent.com/15033260/52791355-b8d0b980-30a3-11e9-992f-6bdd259f9176.png)   
编译从 ```webpack --config ./webpack.config.js``` 命令开始。webpack.config.js 会通过 manifest.json 解析主入口及各个页面入口，将多个入口加入 webpack 的 entry，最后将配置抛给 webpack 执行打包。  
vue 后缀的文件都会走我们的 loader。loader 中首先通过 loader.js 将主入口和页面入口分发到 app-loader.js、page-loader.js，page-loader.js 解析之前，先调用 convert 转换原始 vue 文件，再将页面拆分为组件、template、script、style，然后根据每个部分的内容拼接出用于解析各个部分的 loader（形如```require('!!../../fragment-loader.js!./index.vue')```），拿到 loader 后，我们再在每个 loader 末尾加上我们的 convert loader，保证每种类型的模块都首先经过我们的 loader 转换再往后继续编译，最后把loader 返回给 webpack。webpack 拿到 loader 后，会根据 loader 继续编译。下面是一个 vue 文件转换出的 loader 示例：
```javascript
var $app_template$ = require('!!./json-loader.js!./template-loader.js!./fragment-loader.js?index=0&type=templates!./convert/index.js?type=templates!./index.vue');
var $app_style$ = require('!!./json-loader.js!./style-loader.js?index=0&type=styles!./fragment-loader.js?index=0&type=styles!./convert/index.js?type=styles!./index.vue');
var $app_script$ = require('!!./script-loader.js!babel-loader?presets[]=./node_modules/babel-preset-env&presets=./babel-preset-env&plugins[]=./lib/jsx-loader.js&plugins=./lib/jsx-loader.js&comments=false!./access-loader.js!./fragment-loader.js?index=0&type=scripts!./convert/index.js?type=scripts!./index.vue?isEntry=true');
```
上面的例子中，index.vue 从右到左依次在各个 loader 间流转。
### 模板转换
- 标签转换、属性转换
- 特异性处理对象形式的 class
- 合并表达式属性和静态属性，如: class 和 class
- 删除快应用不支持的属性
- 处理 input 和 checkbox 的 v-model，并将结果传出供 js 转换时使用
### JS 转换
js 分为 import 代码、export 代码、其他代码三部分
- 从 export 的 components 部分收集引入的组件名，并结合 import 部分匹配出组件的路径，最后抛出```{ 组件名: 组件路径 }```，外部拿到结果≈后转换为快应用中的组件引入方式。
- 如果使用了 vue-router，引入快应用的 router，并在 this 上挂载 router
- 使用 Object.defineProperty 实现转换 computed
- 使用快应用的 $watch 转化 watch
- 特殊处理 input change 事件的回调函数
- 实现 v-model
- 生命周期映射
### css转换
hap-toolkit 内部递归处理 css，没有走 webpack，因此 css 转换介入了 hap-toolkit 的内部逻辑
- 将 rem 转换为 px
- 处理选择器
### 其他
#### 根据注释删除特异性代码
首先在我们的 loader 中执行删除，但是 import 的 css 和 js 不能通过这个方式删除。  
import 的 css 在 css 转换时统一删除。import 的 js 通过在 webpack.config.js 的 js loader 部分添加一个 js 预处理 loader 实现统一删除。
#### dev时输出二维码
在 hap-toolkit 中，需要先执行 watch 命令，再执行 server 命令输出二维码。在 vue-hap-tools 中，在一个 dev 命令中，先执行 watch，编译完成后，再输出二维码，避免输出的日志将二维码挤出屏幕。