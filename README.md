# vue-hap-tools
快应用的语法虽然和vue.js比较接近，但也有比较多的差异；当需要将vue.js开发的web应用移植到快应用平台时，又需要重复写一遍相同的逻辑，这对于一个“有追求”的程序员来说，显然无法接受，因此产生了这个工具，提高开发效率。  
vue-hap-tools基于自快应用官方脚手架[hap-toolkit](https://doc.quickapp.cn/tutorial/getting-started/build-environment.html)，支持用vue.js 2.x的语法及其开发方式来开发web与快应用程序，抹平快应用与vue.js开发的差异性，尽可能提高代码复用程度。现已支持vue.js的大部分常用特性、vue-router、vuex。
## 快速开始
使用基于vue-cli的模板工程快速开始
```bash
npm i -g vue-cli
vue init Youjingyu/vue-hap my-project
cd my-project
npm install
```
预览web端效果
```bash
npm run dev
```
预览快应用效果
```
npm run qa-dev
```
预览快应用效果需要在支持快应用的手机（如小米、华为）上安装[调试器](https://www.quickapp.cn/docCenter/post/69)、[预览工具](https://www.quickapp.cn/docCenter/post/69)。安装完成后，扫码即可查看效果。
## 其他
[vue-hap-tools文档](https://github.com/Youjingyu/vue-hap-tools/blob/master/docs/doc.md)  
[已知问题](https://github.com/Youjingyu/vue-hap-tools/blob/master/docs/knownIssues.md)
