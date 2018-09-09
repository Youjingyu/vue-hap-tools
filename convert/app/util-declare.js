const { getStatementAst } = require('../utils')

module.exports = {
  clone: getStatementAst(`
    function _qa_clone (vmData) {
      return doClone(vmData)
      function cloneObj (obj) {
        const res = {}
        Object.keys(obj).forEach((key) => {
          res[key] = doClone(obj[key])
        })
        return res
      }
      function cloneArray (arr) {
        const res = []
        arr.forEach((item) => {
          res.push(doClone(item))
        })
        return res
      }
      function doClone (data) {
        const type = Object.prototype.toString.call(data)
        if (type === '[object Object]') {
          return cloneObj(data)
        } else if (type === '[object Array]') {
          return cloneArray(data)
        } else {
          return data
        }
      }
    }
  `),
  bindWatch: getStatementAst(`
    function _qa_bind_watch ($qa, $vue, vmData, keyPath) {
      keyPath = keyPath || ''
      Object.keys(vmData).forEach((key) => {
        const fullKeyPath = keyPath === '' ? key : keyPath + '.' + key
        if (Object.prototype.toString.call(vmData[key]) === '[object Object]') {
          _qa_bind_watch($qa, $vue, vmData[key], fullKeyPath)
        } else {
          const keyPathArr = keyPath === '' ? [] : keyPath.split('.')
          const len = keyPathArr.length
          $vue.$watch(fullKeyPath, (newVal) => {
            // 根据key path更新数据
            let data = $qa
            for (let i = 0; i < len; i++) {
              data = $qa[keyPathArr[i]]
            }
            data[key] = _qa_clone(newVal)
          }, {deep: true})
        }
      })
    }
  `),
  wrapEvent: getStatementAst(`
    function _qa_wrap_event (e, target) {
      target.value = e.value
      target.checked = e.checked
      Object.defineProperty(e, 'target', {
        value: target
      })
      return e
    }
  `),
  getHandle: getStatementAst(`
    function _qa_get_handle (vnode, eventid, eventTypes) {
      let res = []
      if (!vnode || !vnode.tag) {
        return res
      }
      let { data, children } = vnode || {}
      if (children) {
        children.forEach(node => {
          res = res.concat(_qa_get_handle(node, eventid, eventTypes))
        })
      }
      if (data) {
        const { attrs, on } = data || {}
        if (attrs && on && attrs['data-eventid'] === eventid) {
          eventTypes.forEach(et => {
            const h = on[et]
            if (typeof h === 'function') {
              res.push(h)
            } else if (Array.isArray(h)) {
              res = res.concat(h)
            }
          })
          return res
        }
      }
      return res
    }
  `)
}
