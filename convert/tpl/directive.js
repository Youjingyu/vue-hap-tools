module.exports = {
  'v-for': {
    attr: 'for',
    val: function (val) {
      // eslint-disable-next-line
      return val.replace(/\((.+),[]*(.+)\)/, '($2,$1)')
    }
  },
  'v-if': {
    attr: 'if',
    val: convertExpress
  },
  '^v-else-if$': {
    attr: 'elif',
    val: convertExpress
  },
  '^v-else$': {
    attr: 'else'
  },
  'v-show': {
    attr: 'show',
    val: convertExpress
  },
  '^(:|v-bind:)(.*?)$': {
    attr: function (name, regs) {
      return regs[2]
    },
    val: function (val, regs, staticValue) {
      // 处理style的写法
      // if (type === 'style') {
      //   return val.replace(/('|{|})/g, '');
      // }
      val = convertObjProp(val, regs[2])
      var staticStr = ''
      // 将bind的属性和静态属性合并，如:class和class
      if (staticValue) {
        // 将字符串用{{}}包裹，使hp-tools将其识别为变量
        staticStr = staticValue.trim().split(/[ ]+/).reduce((total, cur) => {
          return total + ' ' + convertExpress(`'${cur}'`)
        }, '')
      }
      return val + staticStr
    }
  },
  '^(@|v-on:)(.*?)$': {
    attr: function (name, regs) {
      // 将输入框的input事件转为快应用的change事件
      var type = regs[2] === 'input' ? 'change' : regs[2]
      return 'on' + type
    }
  },
  'v-model': {
    attr: function (name, regs, extra) {
      return extra.isCheckbox ? 'checked' : 'value'
    },
    val: function (val) {
      return convertExpress(val)
    }
  }
}

function convertExpress (val) {
  return '{{' + val + '}}'
}

function convertObjProp (prop, type) {
  // 转换对象形式的class
  if (type === 'class' && /^{(.|\n|\t)+?}$/.test(prop)) {
    // 删除对象前后的括号，删除空白字符
    // hap-tools会以空格拆分表达式
    let keyValPair = prop.replace(/^([ ]*{)|(}[ ]*)$/g, '').replace(/\s+/g, '').split(',')
    keyValPair = keyValPair.map((item) => {
      const keyVal = item.split(':')
      // 如果class名有单引号，先去除单引号
      const key = keyVal.shift().replace(/'/g, '')
      // 处理有三元表达式的情况
      const value = keyVal.join(':')
      // 将对象形式的class转为三元表达式
      return convertExpress(`${value}?'${key}':''`)
    })
    return keyValPair.join(' ')
  } else {
    return convertExpress(prop)
  }
}
