const fsExtra = require('fs-extra')
const convert = require('../convert')
const convertApp = require('../convert/app')
const convertStyle = require('../convert/style')
const convertJs = require('../convert/js')
const { src } = require('./getSrcDir')

module.exports = function (inputPath, outputPath, cb = () => {}) {
  if (/\.vue$/.test(inputPath) && !/app\.vue$/.test(inputPath)) {
    const fileContent = fsExtra.readFileSync(inputPath, 'utf8')
    fsExtra.outputFileSync(outputPath.replace(/\.vue$/, '.ux'), convert(fileContent))
    cb(null)
  } else if (new RegExp(src + '/app.ux$').test(inputPath)) {
    const fileContent = fsExtra.readFileSync(inputPath, 'utf8')
    const manifest = fsExtra.readJsonSync(src + '/manifest.json')
    fsExtra.outputFileSync(outputPath, convertApp(fileContent, manifest))
    cb(null)
  } else if (/.css$/.test(inputPath)) {
    const fileContent = fsExtra.readFileSync(inputPath, 'utf8')
    fsExtra.outputFileSync(outputPath, convertStyle(fileContent))
    cb(null)
  } else if (/.js$/.test(inputPath)) {
    const fileContent = fsExtra.readFileSync(inputPath, 'utf8')
    fsExtra.outputFileSync(outputPath, convertJs(fileContent, null, true))
    cb(null)
  } else {
    fsExtra.copySync(inputPath, outputPath)
    cb(null)
  }
}
