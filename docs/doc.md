# 文档
vue-hap-tools基于语法树抹平vue.js与快应用的语法差异，并hack vue.js支持但快应用不支持的特性，从而使代码复用在两端。但由于快应用底层的限制，部分功能会受到限制，但只要能规避这些限制，原则上是可以做到一套代码两端运行的，详情参考[已知问题](https://github.com/Youjingyu/vue-hap-tools/blob/master/docs/knownIssues.md)。
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
app.vue、main.js是针对web平台的入口文件，不做强制要求，取决于你如何打包到web平台。app.ux、manifest.json、pages必需；[app.ux](https://doc.quickapp.cn/framework/source-file.html)可以为空，主要用于添加快应用中的全局方法；manifest.json用于定义快应用相关信息，包括路由信息、桌面icon等，参考[manifest文件](https://doc.quickapp.cn/framework/manifest.html)；pages用于放置页面，需要注意pages中的文件夹名，需要与manifest.json中的路由名对应。
## 使用
安装：
```
npm i vue-hap-tools --save-dev
```
安装后需要在package.json的scripts字段中添加如下代码：
```json
"scripts": {
  "qa-dev": "npm run qa-watch & npm run qa-server",
  "qa-server": "vue-hap server",
  "qa-watch": "vue-hap watch",
  "qa-build": "vue-hap build",
  "qa-release": "vue-hap release"
}
```
然后执行```npm run qa-dev```查看效果  
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