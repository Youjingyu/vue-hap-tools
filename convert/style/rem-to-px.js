module.exports = function (styleVal) {
  if (/([0-9]+)\.?([0-9]*)\s*rem/.test(styleVal)) {
    styleVal = styleVal.split(/\s+/).map(item => {
      if (/rem$/.test(item)) {
        return parseFloat(item, 10) * 100 + 'px'
      }
      return item
    }).join(' ')
  }
  return styleVal
}
