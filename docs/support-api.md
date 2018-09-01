### Vue基础特性支持情况
与[Vue基础教程](https://cn.vuejs.org/v2/guide/)对应  

| 特性 | 支持情况 | 备注 |
|-----|-----|-----|
| 模板语法 | ✅ |  |
| v-bind, :bind | ✅ |  |
| v-on, @on | ⚠️ | 不支持修饰符 |
| v-for | ✅ |  |
| v-model | ⚠️ | 不支持修饰符，不支持在自定义组件上使用 |
| v-show | ✅ |  |
| 条件渲染 | ✅ |  |
| computed | ✅ |  |
| watch | ✅ |  |
| class绑定 | ️️️️✅ | |
| style绑定 | ⚠️ | 当style、:style同时使用时，:style不支持数组绑定；不支持多重值 |
| 自定义组件 | ️⚠️ | 不支持动态组件、异步组件 |  
| 过度 & 动画 | ❌ |  |
| 可复用性 & 组合 | ️⚠️ | 只支持混入、插件 |

### Vue api支持情况  
与[Vue api文档](https://cn.vuejs.org/v2/api)对应  
  
| 特性 | 支持情况 | 备注 |
|-----|-----|-----|
| Vue全局配置 | ✅ |  |
| Vue全局Api |  |  |
| Vue.extend | ✅ |  |
| Vue.nextTick | ❌ | 虚拟DOM与真实节点均不受js控制，无法获取准确的视图更新时机 |
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
| 选项 / 生命周期钩子 | ✅ |  |
| 选项 / 资源 | ❌ |  |
| 选项 / 组合 | ️️️️️️️️️️️️️️️⚠️ | 支持，不建议使用 |
| 选项 / 其它 | ⚠️ | 部分支持，不建议使用 |
| 实例属性 |  |  |
| vm.$data | ✅ |  |
| vm.$props | ❌ |  |
| vm.$el | ❌ |  |
| vm.$options | ✅ |  |
| vm.$parent | ️️⚠️ | 获取到的是快应用元素对象 |
| vm.$root | ⚠️ | 获取到的是快应用root对象 |
| vm.$children | ❌ | |
| vm.$slots | ❌ |  |
| vm.$scopedSlots | ❌ |  |
| vm.$refs | ️️⚠️ | 获取到的是快应用元素对象 |
| vm.$isServer | ❌ |  |
| vm.$attrs | ❌ |  |
| vm.$listers | ❌ |  |
| 实例方法 / 数据 |  |  | 
| vm.$watch | ✅ |  |
| vm.$set | ✅ |  |
| vm.$delete | ✅ |  |
| 实例方法 / 事件 |  |  |
| vm.$on | ✅ |  |
| vm.$once | ✅ |  |
| vm.$off | ✅ |  |
| vm.$emit | ✅ |  |
| 实例方法 / 生命周期 |  |  | 
| vm.$mount | ✅ |  |
| vm.$forceUpdate | ✅ |  |
| vm.$nextTick | ✅ |  |
| vm.$destroy | ✅ |  |
| 指令 | ️️⚠️ | 不支持的有：v-text, v-html, v-pre, v-cloak, v-once |
| 特殊特性 | ❌ |  |
| 内置组件 | ️️️️⚠️ | 仅支持slot |
| VNode接口 | ❌ |  |
| 服务端渲染 | ❌ |  |  
