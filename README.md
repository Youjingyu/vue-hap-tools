# vue-hap-tools

快应用的语法虽然和 vue.js 比较接近，但也有比较多的差异；当需要将 vue.js 开发的 web 应用移植到快应用平台时，又需要重复写一遍相同的逻辑，这对于一个“有追求”的程序员来说，显然无法接受，因此产生了这个工具，提高开发效率。  
vue-hap-tools 基于快应用官方脚手架 [hap-toolkit](https://doc.quickapp.cn/tutorial/getting-started/build-environment.html)，支持用 vue.js 2.x 的语法及其开发方式来开发 web 与快应用程序，抹平快应用与 vue.js 开发的差异性，尽可能提高代码复用程度。现已支持 vue.js 的大部分常用特性、vue-router、vuex。
## 快速开始
使用基于 vue-cli 的模板工程快速开始
```bash
npm install -g @vue/cli
npm install -g @vue/cli-init
vue init Youjingyu/vue-hap my-project
cd my-project
# 或者执行 npm install
yarn
```
预览 web 端效果
```bash
npm run dev
```
预览快应用效果
```bash
# 开启hot reload模式
npm run qa-watch
# 开启预览server，用手机扫描二维码安装应用
npm run qa-server
```
预览快应用效果需要在支持快应用的手机（如小米、华为）上安装[调试器](https://www.quickapp.cn/docCenter/post/69)、[预览工具](https://www.quickapp.cn/docCenter/post/69)。安装完成后，扫码即可查看效果。  
下面是我们做的一个 demo，同一套代码，分别在 web 和快应用上的效果  
#### 快应用效果  
<img src="https://user-images.githubusercontent.com/15033260/52790822-807cab80-30a2-11e9-8ba5-84bc714efb5d.gif" alt="快应用效果" height="500" />  

#### web效果  
<img src="https://user-images.githubusercontent.com/15033260/52790806-79ee3400-30a2-11e9-93c1-6fbd639a6d8c.gif" alt="web 效果" />

## 更进一步
[vue-hap-tools 文档](https://github.com/Youjingyu/vue-hap-tools/blob/master/docs/doc.md)  
[vue api 支持情况](https://github.com/Youjingyu/vue-hap-tools/blob/master/docs/support-api.md)   
[使用 vuex、vue-router](https://github.com/Youjingyu/vue-hap-tools/blob/master/docs/router-vuex.md)   
[已知问题](https://github.com/Youjingyu/vue-hap-tools/blob/master/docs/knownIssues.md)  
