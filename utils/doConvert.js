const fsExtra = require('fs-extra')
const path = require('path')
const convert = require('../convert')
const convertApp = require('../convert/app')
const convertStyle = require('../convert/style')
const { preProcess } = require('../convert/js')
const { src } = require('./getSrcDir')
const logger = require('./logger')

const appPath = path.join(src, 'app.ux')
const manifest = fsExtra.readJsonSync(path.join(src, 'manifest.json'))

module.exports = function (inputPath, outputPath, cb = () => {}) {
  logger.setFile(inputPath)
  if (/\.vue$/.test(inputPath) && !/app\.vue$/.test(inputPath)) {
    const fileContent = fsExtra.readFileSync(inputPath, 'utf8')
    fsExtra.outputFileSync(outputPath.replace(/\.vue$/, '.ux'), convert(fileContent))
    cb(null)
  } else if (inputPath === appPath) {
    const fileContent = fsExtra.readFileSync(inputPath, 'utf8')
    fsExtra.outputFileSync(outputPath, convertApp(fileContent, manifest))
    cb(null)
  } else if (/.css$/.test(inputPath)) {
    const fileContent = fsExtra.readFileSync(inputPath, 'utf8')
    fsExtra.outputFileSync(outputPath, convertStyle(fileContent))
    cb(null)
  } else if (/.js$/.test(inputPath)) {
    const fileContent = fsExtra.readFileSync(inputPath, 'utf8')
    fsExtra.outputFileSync(outputPath, preProcess(fileContent))
    cb(null)
  } else {
    fsExtra.copySync(inputPath, outputPath)
    cb(null)
  }
}
