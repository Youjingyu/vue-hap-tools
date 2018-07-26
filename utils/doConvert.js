const fsExtra = require('fs-extra')
const convert = require('../convert')

module.exports = function (inputPath, outputPath, cb = () => {}) {
  if (/\.vue$/.test(inputPath)) {
    const fileContent = fsExtra.readFileSync(inputPath, 'utf8')
    fsExtra.outputFileSync(outputPath.replace(/\.vue$/, '.ux'), convert(fileContent))
    cb(null)
  } else {
    fsExtra.copySync(inputPath, outputPath)
    cb(null)
  }
}
