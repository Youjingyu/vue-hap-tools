const path = require('path')
const fsExtra = require('fs-extra')
const walk = require('walk')
const childProcess = require('child_process')
const fixSrcDir = require('./utils/fixSrcDir')
const doConvert = require('./utils/doConvert')
const {
  src,
  qaSrc
} = require('./utils/getSrcDir')

const defaultOption = {
  watch: false
}

module.exports = function (option = {}, cb = () => {}) {
  option = Object.assign(defaultOption, option)
  // 修改hap-toolkit的webpack.config.js的源码路径配置
  fixSrcDir.fixWebpackConfig((err) => {
    if (err) throw err

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
      if (option.watch === true) {
        childProcess.fork('./utils/watchFile.js')
      }
      cb()
    })
  })
}
