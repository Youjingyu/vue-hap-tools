const { getStatementAst } = require('../utils')

module.exports = {
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
            data[key] = newVal
          })
        }
      })
    }
  `),
  wrapEvent: getStatementAst(`
    function _qa_wrap_event (e) {
      return {
        target: {
          value: e.target.attr.value,
          checked: e.target.attr.checked
        }
      }
    }
  `)
}
