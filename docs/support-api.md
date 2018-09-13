## Vue api支持情况
下列不支持的特性，大多是由于快应用不支持类似特性，或者支持但功能比较羸弱，因此无法实现
### 基础特性支持情况
与[Vue基础教程](https://cn.vuejs.org/v2/guide/)对应  

| 特性 | 支持情况 | 备注 |
|-----|-----|-----|
| 模板语法 | ✅ |  |
| v-bind, :bind | ✅ |  |
| v-on, @on | ⚠️ | 事件修饰符无效 |
| v-for | ⚠️ | 不能遍历对象 |
| v-model | ⚠️ | 不支持在自定义组件上使用；由于快应用限制，radio、select元素暂不支持v-model |
| v-show | ✅ |  |
| 条件渲染 | ✅ |  |
| computed | ✅ |  |
| watch | ✅ |  |
| class绑定 | ️️️️✅ | |
| style绑定 | ⚠️ | 当style、:style同时使用时，:style不支持数组绑定；不支持多重值 |
| 自定义组件 | ️⚠️ | 不支持动态组件、异步组件 |  
| 过度 & 动画 | ❌ |  |
| 可复用性 & 组合 | ️⚠️ | 只支持混入、插件 |

### api支持情况  
与[Vue api文档](https://cn.vuejs.org/v2/api)对应  
  
| 特性 | 支持情况 | 备注 |
|-----|-----|-----|
| Vue全局配置 | ✅ |  |
| Vue全局Api |  |  |
| Vue.extend | ✅ |  |
| Vue.nextTick | ✅  |  |
| Vue.set | ✅ |  |
| Vue.delete | ✅ |  |
| Vue.directive | ❌ |  |
| Vue.filter | ❌ |  |
| Vue.component | ️️️️️️️️️️️️️⚠️ | 建议使用vue单文件组件 |
| Vue.use | ✅ |  |
| Vue.mixin | ✅ |  |
| Vue.compile | ❌ |  |
| Vue.version | ✅ |  |
| 选项 / 数据 | ️️️️️️️️️️️️️️️✅ | |
| 选项 / DOM | ❌ |  |
| 选项 / 生命周期钩子 |  |  |
| beforeCreate | ✅ |  |
| created | ✅ |  |
| beforeMount | ✅ |  |
| mounted | ✅ |  |
| beforeUpdate | ✅ | |
| updated | ✅ |  |
| activated | ❌ |  |
| deactivated | ❌ |  |
| beforeDestroy | ✅ |  |
| destroyed | ✅ |  |
| errorCaptured | ✅ |  |
| 选项 / 资源 |  |  |
| directives | ❌ |  |
| filters | ❌ |  |
| components | ✅ |  |
| 选项 / 组合 | ️️️️️️️️️️️️️️️⚠️ | 支持，不建议使用 |
| 选项 / 其它 | ⚠️ | 部分支持，不建议使用 |
| 实例属性 |  |  |
| vm.$data | ✅ |  |
| vm.$props | ✅ |  |
| vm.$el | ❌ |  |
| vm.$options | ✅ |  |
| vm.$parent | ️️✅ |  |
| vm.$root | ✅ |  |
| vm.$children | ❌ | |
| vm.$slots | ❌ |  |
| vm.$scopedSlots | ❌ |  |
| vm.$refs | ️️⚠️ | 获取到的是快应用元素对象 |
| vm.$isServer | ✅ |  |
| vm.$attrs | ✅ |  |
| vm.$listeners | ✅ |  |
| 实例方法 / 数据 |  |  | 
| vm.$watch | ✅ |  |
| vm.$set | ⚠️ | 不能set嵌套数据，如不能vm.$set(vm.someData, key, data)，只能vm.$set(vm, key, data) |
| vm.$delete | ✅ |  |
| 实例方法 / 事件 |  |  |
| vm.$on | ✅ |  |
| vm.$once | ✅ |  |
| vm.$off | ✅ |  |
| vm.$emit | ✅ |  |
| 实例方法 / 生命周期 |  |  | 
| vm.$mount | ✅ |  |
| vm.$forceUpdate | ✅ |  |
| vm.$nextTick | ⚠️ | 与web中的行为可能不一致 |
| vm.$destroy | ✅ |  |
| 指令 | ️️⚠️ | 不支持的有：v-text, v-html, v-pre, v-cloak, v-once |
| 特殊特性 | ❌ |  |
| 内置组件 | ️️️️⚠️ | 仅支持slot |
| VNode接口 | ✅ |  |
| 服务端渲染 | ❌ |  |  
