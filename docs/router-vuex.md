## 使用vuex
在web平台下，使用vuex一般是在页面入口js（比如main.js）中初始化:
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
在快应用平台，则需要在app.ux中初始化，之后在页面以及组件中使用vuex的方式与web平台中相同：
```html
<!-- app.ux文件 -->
<script>
import Vue from 'vue'
import store from './store'

// 因为快应用中，Vue是在每个页面单独实例化的
// 而vuex默认是从vm.$options中查找store
// 为了不在每个页面引入store，因此使用mixin将store挂载到Vue实例
Vue.mixin({ 
  beforeCreate () {
    this.$store =  typeof store === 'function' ? store() : store
  }
})
export default {}
</script>
```
## 使用vue-router
在web平台下，一般是在入口js中引入vue-router：
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
快应用有自己的路由实现[@system.router](https://doc.quickapp.cn/features/system/router.html?h=%E8%B7%AF%E7%94%B1)，我们需要在manifest.json中配置路由信息：
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
在```features```字段中添加router的声明，告诉快应用，你需要使用路由，然后在```router```中添加页面信息，详情参考[manifest.json](https://doc.quickapp.cn/framework/manifest.html)    
如果配置了路由信息，vue-hap-tools会自动在app.ux中引入@system.router，并将其挂载在Vue实例上，然后将其与vue-router的差异性抹平。但由于@system.router的限制，并不能完全实现vue-router的功能，暂时只支持下面的方法：  
- router.push  
只支持path跳转，path必须是页面路径（manifest.json中配置的路径）；页面传参只能用query；示例：
  ```javascript
  router.push({ 
    path: 'pages/page1', 
    query: { plan: 'private' }
  })
  ```
- router.replace  
只支持path跳转，path必须是页面路径（manifest.json中配置的路径）；页面传参只能用query，示例：  
  ```javascript
  router.replace({ 
    path: 'pages/page1', 
    query: { plan: 'private' }
  })
  ```
- router.back  

## 其他Vue插件
从上面vuex、vue-router的使用可以看到，基本都是使用```Vue.mixin```在app.ux中将插件挂载到Vue实例，从而实现与web平台的使用方式一致。   
对于其它vue插件，也可以用类似的方式引入。需要注意的是，快应用中不存在DOM，并且其底层的虚拟DOM我们也不能控制，因此依赖DOM、虚拟DOM的插件可能不能像预期那样工作。