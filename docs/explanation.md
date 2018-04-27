# 框架原理说明
vue-hap-tools在hap-toolkit编译之前进行转换，将转换结果传给hap-toolkit。
编译过程如下：  
首先通过manifest.json解析主入口及各个页面入口，再通过loader.js将主入口和页面入口分发到app-loader.js、page-loader.js，page-loader.js解析之前，先调用convert转换原始vue文件，接着将页面拆分为组件、template、script、style，然后根据每个部分的内容拼接为loader（如```require('!!../../fragment-loader.js!./index.vue')```），，webpack会解析