const path = require('path')
const fsExtra = require('fs-extra')
const walk = require('walk')
const chokidar = require('chokidar')
const convert = require('./convert')
const fixSrcDir = require('./utils/fixSrcDir')

const defaultOption = {
  watch: false,
  sourceDir: 'src'
}

module.exports = function (option = {}, cb = () => {}) {
  option = Object.assign(defaultOption, option)
  // 修改hap-toolkit的webpack.config.js的源码路径配置
  fixSrcDir.fixWebpackConfig((err) => {
    if (err) throw err

    const src = path.join(process.cwd(), option.sourceDir)
    const qaSrc = path.join(process.cwd(), 'qa-src')

    fsExtra.emptyDirSync(qaSrc)

    const walker = walk.walk(path.resolve(__dirname, src))
    walker.on('file', (root, fileStats, next) => {
      const filePath = path.resolve(root, fileStats.name)
      doConvert(filePath, filePath.replace(src, qaSrc), next)
    })
    walker.on('errors', function (root, nodeStatsArray, next) {
      throw new Error('copy file error')
    })
    walker.on('end', function (root, nodeStatsArray, next) {
      cb()
    })

    if (option.watch === true) {
      chokidar.watch(src).on('change', (event, filePath) => {
        const qaPath = filePath.replace(src, qaSrc)
        doConvert(filePath, qaPath)
      })
    }
  })
}

function doConvert (inputPath, outputPath, cb = () => {}) {
  if (/\.vue$/.test(inputPath)) {
    const fileContent = fsExtra.readFileSync(inputPath, 'utf8')
    fsExtra.outputFileSync(outputPath.replace(/\.vue$/, '.ux'), convert(fileContent))
    cb(null)
  } else {
    fsExtra.copySync(inputPath, outputPath)
    cb(null)
  }
}
