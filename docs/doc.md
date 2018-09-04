# 文档
vue-hap-tools以复用web端代码为目标，用vue中与平台无关的核心代码[vue core](https://www.npmjs.com/package/@whale-you/vue-core)来管理快应用组件，从而使快应用支持vue的大多数特性，并达到复用代码的目的。
但由于快应用底层的限制，我们需要规避部分问题，详情参考[已知问题](https://github.com/Youjingyu/vue-hap-tools/blob/master/docs/knownIssues.md)、以及[Vue api支持情况](https://github.com/Youjingyu/vue-hap-tools/blob/master/docs/support-api.md)。
## 目录结构
vue-hap-tools按照约定的目录结构来编译：
```bash
src
├── app.vue
├── app.ux
├── main.js
├── manifest.json
├── pages
│   ├── Page1
│   │   └── index.vue
│   └── Page2
│       ├── index.vue
```
只要满足这个目录结构，vue-hap-tools就可以将源码编译到快应用平台。编译到web平台的方式由你自己决定（推荐使用快速开始[模板工程](https://github.com/Youjingyu/vue-hap)）。  
- app.vue、main.js，可选；app.vue、main.js是针对web平台的入口文件，不做强制要求，取决于你如何打包到web平台
- app.ux，必需；[app.ux](https://doc.quickapp.cn/framework/source-file.html)是快应用的入口文件，主要用于添加快应用中的全局方法，以及Vue全局配置，比如[使用vuex](https://github.com/Youjingyu/vue-hap-tools/blob/master/docs/router-vuex.md#%E4%BD%BF%E7%94%A8vuex)
- manifest.json，必需；[manifest.json](https://doc.quickapp.cn/framework/manifest.html)用于定义快应用相关信息，包括路由信息、桌面icon等，比如[使用vue-router](https://github.com/Youjingyu/vue-hap-tools/blob/master/docs/router-vuex.md#%E4%BD%BF%E7%94%A8vue-router)
- pages，可选；页面推荐放在pages目录中，但不是必须的，最终以manifest.json中配置的页面路径为准
## 使用
安装：
```
npm i vue-hap-tools --save-dev
```
安装后需要在package.json的scripts字段中添加如下代码：
```json
"scripts": {
  "qa-server": "vue-hap server",
  "qa-watch": "vue-hap watch",
  "qa-build": "vue-hap build",
  "qa-release": "vue-hap release"
}
```
然后执行```npm run qa-watch```、```npm run qa-server```查看效果  
如果要运行```npm run qa-release```来发布，需要在项目根目录下添加证书：
```bash
sign
└── release
    ├── certificate.pem
    └── private.pem
```
## 样式
快应用只支持部分web样式，可以理解为web的子集，这部分暂时还不能很好地抹平两端的差异性，在开发之前建议先熟悉[通用样式](https://doc.quickapp.cn/widgets/common-styles.html)以及特定标签支持的样式，比如只有a、span等文本类标签才支持文本样式。  
另外需要注意，快应用的长度单位以manifest.json中config.designWidth的值为基准，该基准值最好设置为设计稿的宽度，然后直接按照设计稿中的px数据写样式就行了。最后再针对web项目使用[postcss-px2rem](https://www.npmjs.com/package/postcss-px2rem)将px转换为rem，快速开始[模板工程](https://github.com/Youjingyu/vue-hap)就是这样做的。当然，你也可以写rem，按照一般使用rem的惯例，vue-hap-tools会以 1rem=100px 的比率来将rem转为px，从而兼容快应用。
## 条件注释
理想情况下，我们会尽可能保证web端和快应用端的代码一致，但难免会遇到需要写部分差异性代码的时候。vue-hap-tools使用约定的注释格式来识别差异性代码。注释之间的代码会在快应用中删除。
#### html注释格式
```html
<!-- quick app ignore start -->
<div>
  <span></span>
</div>
<!-- quick app ignore end -->
```
#### css注释格式
```css
/* quick app ignore start */
.class1{

}
.class2{

}
/* quick app ignore end */
```
#### js注释格式
```js
/* quick app ignore start */
const data = localStorage.getItem('data-key');
/* quick app ignore end */
```
vue-hap-tools只负责打包到快应用，因此可以在打包过程中去除部分针对web的代码。如果需要在web平台中去除针对快应用的代码，需要在打包到web的过程中处理；另外一个方式是，使用特殊变量（如快应用中没有window变量）来识别不同运行环境，从而实现差异性功能。
## 排除文件
默认情况下，vue-hap-tools会处理src下的所有文件，并对代码做检查，如果某些代码文件只是针对web平台的，可能会报一系列警告，为了避免这些无用的警告，你可以在manifest.json中配置忽略这些文件，配置遵从[minimatch](https://www.npmjs.com/package/minimatch)的规则：
```json
// manifest.json
{ 
  // ...其他配置
  "vue-hap-ignore": ["css/web-reset.css"]
}
```