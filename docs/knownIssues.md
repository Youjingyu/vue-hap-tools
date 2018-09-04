## 已知问题
### 标签问题
快应用的组件可以简单分为容器组件（div等）、文本组件、表单组件、其他组件。快应用组件与html标签转换规则如下：  
#### 标签转换列表
| 快应用组件 | html标签 |  
|-----|-----|  
| div | div;  p,h1,h2,h3,h4,h5,h6;  aside,footer,header,nav,main,section,figcaption,figure;   dd,dl,dt,ul,ol,li;  table,thead,tbody,td,th,tr;  fieldset,legend,article |  
| block | template |  
| progress | progress |  
| text | span,strong,i,small,sub,sup,time,u,var,b,abbr,cite,code,em,q,address,pre,del,ins,mark |  
| span | span嵌套的span |  
| a | a,router-link |  
| label | label |  
| textarea | textarea |  
| input | input,button |  
| image | img |  
| video | video |  
- 块级元素（即上面表格中div组件对应的html标签）不能直接放置文本，需要这样使用:
```html
<div>
  <span>文本</span>
</div>
```
未兼容原因：快应用会忽略容器组件下的文本；并且容器组件不支持文本样式，因此只能直接在文本标签上设置样式。如果做了兼容，设置在容器组件上的文本样式会丢失。
- span标签最多支持两层嵌套，比如下面的代码不被允许：
```html
<span>
  <span>
    <span>文本</span>
  </span>
</span>
```
未兼容原因：快应用对text、span组件的嵌套限制
#### TODO
- 由于快应用list组件比较特殊，暂时没有把ul、ol等列表标签转换为list组件。未来可能会在web端实现一个与list组件表现一致的组件。

### 样式问题
由于快应用支持的样式有限，样式很难抹平，但快应用支持的样式，web肯定是支持的，因此可以针对快应用写样式，然后运行在两端。参考快应用[通用样式](https://doc.quickapp.cn/widgets/common-styles.html)、[文本样式](https://doc.quickapp.cn/widgets/text.html)。  
#### 特异性
下面是快应用关于样式特异性的说明：
- 只有文本组件（a、span、label、text等）才支持[文本样式](https://doc.quickapp.cn/widgets/text.html)
- 只支持#id、.class 、tag、后代、直接后代选择器。由于快应用组件类型数量限制，标签选择器暂只支持div、span、a、input、label、textarea
- 对于多级选择器，只有最后一个选择器的改变，组件才会更新，比如下面的代码，将div class中的parent1修改为parent2样式不会更新，child1修改为child2则会更新
```html
<style>
  .parent1 .child1 {}
  .parent2 .child1 {}
  .parent1 .child2 {}
</style>
<div class="parent1 child1">
  <div></div>
</div>
```
- 快应用中使用visibility切换元素是否可见存在bug，切换为visibility:visible后，再切换为visibility:hidden，不生效
- style对象绑定中border样式不生效，比如
```html
<template>
  <div :style=[styleObj]></div>
</template>
<script>
  export default {
    data () {
      return {
        styleObj: {
          color: '#ccc',
          border: '1px solid  #ccc' // 不生效
        }
      }
    }
  }
</script>
```
- 当style、:style同时使用时，:style不支持数组绑定，比如
```html
<template>
  <!-- styleObj无效 -->
  <div style="color: red" :style=[styleObj]></div>
</template>
```
#### TODO
下面是样式中需要规避的点，未来会逐一解决
- 快应用中div组件默认是display: flex，因此[标签转换列表](https://github.com/Youjingyu/vue-hap-tools/blob/master/docs/knownIssues.md#%E6%A0%87%E7%AD%BE%E8%BD%AC%E6%8D%A2%E5%88%97%E8%A1%A8)中div组件对应的html标签需要设置为display: flex
- 不能依赖web标签的默认样式。比如h1、h2、p都会转换为div组件，其默认样式会丢失
- border-color不支持rgb形式的颜色

### js问题
- 快应用输入框不支持键盘相关事件（keyup、keydown等），也不支持input事件，监听输入框值变化只能用change事件
- 事件绑定不支持表达式
- 快应用事件不冒泡
- 快应用的bug，自定义事件的回调函数不能加括号传参，比如下面这样写会报错：
  ```html
    <!-- 报错 -->
    <component @customEvent="handle('someData')"></component>
    <!-- 不报错 -->
    <component @customEvent="handle"></component>
  ```
- 快应用的bug，列表中的checkbox会被复用，删除、添加列表项时，可能会错误地触发checkbox的onchange事件； 
- 不支持watch $route变量 
- 由于快应用会把页面间的数据直接绑定到this上，所以this实例上不应该有与上个页面传递的query数据的key冲突的属性，否则会出现覆盖问题