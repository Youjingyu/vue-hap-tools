const convert = require('./convert')

module.exports = function (name, value, attrInfo, components = []) {
  for (let key in convert) {
    const matches = name.match(new RegExp(key))
    if (name.match(new RegExp(key))) {
      const res = convert[key](value, attrInfo, matches, components)
      // console.log(res)
      return res
    }
  }
  return {
    name,
    value
  }
}
