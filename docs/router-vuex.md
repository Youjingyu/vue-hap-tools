## 使用vuex
在 web 平台下，使用 vuex 一般是在页面入口 js（比如 main.js）中初始化:
```javascript
import Vue from 'vue'
import App from './app.vue'
import store from './store'
new Vue({
  store,
  el: '#app',
  render: h => h(App)
})
```
在快应用平台，则需要在 app.ux 中初始化，之后在页面以及组件中使用 vuex 的方式与 web 平台中相同：
```html
<!-- app.ux文件 -->
<script>
import Vue from 'vue'
import store from './store'

// 因为快应用中，Vue 是在每个页面单独实例化的
// 而 vuex 默认是从 vm.$options 中查找 store
// 为了不在每个页面引入 store，因此使用 mixin 将 store 挂载到 Vue 实例
Vue.mixin({ 
  beforeCreate () {
    this.$store =  typeof store === 'function' ? store() : store
  }
})
export default {}
</script>
```
## 使用vue-router
在 web 平台下，一般是在入口 js 中引入v ue-router：
```javascript
import Vue from 'vue'
import App from './app.vue'
import router from './router'
new Vue({
  router,
  el: '#app',
  render: h => h(App)
})
```
快应用有自己的路由实现 [@system.router](https://doc.quickapp.cn/features/system/router.html?h=%E8%B7%AF%E7%94%B1)，我们需要在 manifest.json 中配置路由信息：
```json
{
  "package": "com.application.demo",
  "name": "demo",
  "versionName": "1.0.0",
  "versionCode": "1",
  "minPlatformVersion": "101",
  "icon": "/assets/logo.png",
  "features": [
    { "name": "system.router" }
  ],
  "permissions": [{
    "origin": "*"
  }],
  "config": {
    "logLevel": "debug",
    "designWidth": 750
  },
  "router": {
    "entry": "./pages/TodoMVC",
    "pages": {
      "./pages/TodoMVC": {
        "component": "index"
      }
    }
  }
}
```
在 ```features``` 字段中添加 router 的声明，告诉快应用，你需要使用路由，然后在 ```router``` 中添加页面信息，详情参考[manifest.json](https://doc.quickapp.cn/framework/manifest.html)    
如果配置了路由信息，vue-hap-tools 会自动在 app.ux 中引入 @system.router，并将其挂载在 Vue 实例上，然后将其与 vue-router 的差异性抹平。但由于 @system.router 的限制，并不能完全实现 vue-router 的功能，暂时只支持下面的方法：  
- router.push  
只支持 path 跳转，path 必须是页面路径（manifest.json 中配置的路径）；页面传参只能用 query；示例：
  ```javascript
  router.push({ 
    path: 'pages/page1', 
    query: { plan: 'private' }
  })
  ```
- router.replace  
只支持 path 跳转，path 必须是页面路径（manifest.json 中配置的路径）；页面传参只能用 query，示例：  
  ```javascript
  router.replace({ 
    path: 'pages/page1', 
    query: { plan: 'private' }
  })
  ```
- router.back  

## 其他Vue插件
从上面 vuex、vue-router 的使用可以看到，基本都是使用 ```Vue.mixin``` 在 app.ux 中将插件挂载到 Vue 实例，从而实现与 web 平台的使用方式一致。   
对于其它 vue 插件，也可以用类似的方式引入。需要注意的是，快应用中不存在 DOM，因此依赖 DOM 的插件可能不能像预期那样工作。