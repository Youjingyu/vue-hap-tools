/*
 * Copyright (C) 2017, hapjs.org. All rights reserved.
 */

/**
 * assert文档：http://chaijs.com/api/assert/
 */

var chai = require('hybrid-chai/chai')
require('hybrid-mocha/mocha.js')

// 注入全局
global.assert = chai.assert
global.expect = chai.expect
global.should = chai.should()

global.model = null

/**
 * 近似相等，最多2个像素差距
 */
global.assert.approxEqual = function (arg1, arg2, message) {
  const gap = Math.abs(Math.abs(arg1) - Math.abs(arg2))
  global.assert.isAtMost(gap, 2, message)
}

// 获取数据
global.loadData = function (key) {
  var val = null
  if (typeof window === 'undefined') {
    val = global[key]
  }
  else {
    val = localStorage.getItem(key)
  }
  return JSON.parse(val || null)
}

// 保存数据
global.saveData = function (key, val) {
  if (typeof window === 'undefined') {
    global[key] = JSON.stringify(val)
  }
  else {
    localStorage.setItem(key, JSON.stringify(val))
  }
  return val
}

global.pushData = function (key, item) {
  var dataList = global.loadData(key) || []
  dataList.push(item)
  global.saveData(key, dataList)
}

global.window && (global.window.onerror = function () {
  console.info('error: ', arguments)
})


var timer = 0
/**
 * 下次调用断言时的时间
 */
global.nextTime = function (reset) {
  reset !== undefined && (timer = reset)
  return (timer += 50)
}

/**
 * 对出错包装并传递给done
 */
global.setTimeoutDone = function (fn, ms, done) {
  if (!done) {
    throw new Error('[ERROR] 异步的测试用例请传递Mocha的done函数！')
  }
  global.setTimeout(function () {
    try {
      fn()
    }
    catch (err) {
      done(err)
    }
  }, ms)
}

/**
 * 标准化(去除px单位、合并或者展开、尺寸标准化)
 */
global.normalize = function (map) {
  map = map || {}

  Object.keys(map).forEach(function (key) {
    // 去除px单位
    map[key] && map[key].replace && (map[key] = map[key].replace(/px/g, ''))
    let val = map[key]

    // 合并或者展开
    if (['margin', 'padding', 'borderWidth', 'borderColor'].indexOf(key) > -1 && /\s+/.test(val)) {
      const valList = val.replace(/,\s+/g, ',').split(/\s+/)
      const valHash = valList.reduce((sum, v) => {
        sum[v] = true
        return sum
      }, {})

      if (Object.keys(valHash).length === 1) {
        // 合并
        map[key] = valList[0]
      }
      else {
        // 完全展开
      }
    }

    // 750标准尺寸
    val = map[key]
    if (/^\d*\.?\d*$/.test(val) && !isNaN(parseFloat(val))) {
      map[key] = +val
      // 标准尺寸
      map[key + 'Std'] = Math.round(map[key] * 750 / global.Env.deviceWidth)
    }
  })
  return map
}

/**
 * 获取宽高以及相对距离
 * @desc 相当于 node.getBoundingRect()
 * @param ref
 * @return {*|{content}|{}}
 */
global.nodeRect = function (ref) {
  // Node节点转换
  ref = ref.ref || ref

  global.model = global.model || require('@system.model')
  return global.model.getBoundingRect({ ref: ref }) || {}
}

/**
 * 获取设置的节点属性
 * @param ref
 * @return {*|{}}
 */
global.nodeAttr = function (ref) {
  // Node节点转换
  ref = ref.ref || ref

  global.model = global.model || require('@system.model')
  return global.model.getComputedAttr({ ref: ref }) || {}
}

/**
 * 获取设置的节点样式
 * @param ref
 * @return {*|{content}|CSSStyleDeclaration|CssStyle|{}}
 */
global.nodeStyle = function (ref) {
  // Node节点转换
  ref = ref.ref || ref

  global.model = global.model || require('@system.model')
  return global.model.getComputedStyle({ ref: ref }) || {}
}

/**
 * 获取节点信息
 * @param ref
 * @return {*|{content}|{}}
 */
global.nodeInfo = function (ref) {
  // Node节点转换
  ref = ref.ref || ref

  global.model = global.model || require('@system.model')
  return global.model.getComponent({ ref: ref }) || {}
}


