const path = require('path')
const fsExtra = require('fs-extra')
const walk = require('walk')
const childProcess = require('child_process')
const fixSrcDir = require('./utils/fixSrcDir')
const doConvert = require('./utils/doConvert')
const isExclude = require('./utils/exclude')
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

    let hasBabelrc = false
    const walker = walk.walk(path.resolve(__dirname, src))
    walker.on('file', (root, fileStats, next) => {
      const name = fileStats.name
      const filePath = path.resolve(root, name)
      if (isExclude(filePath)) {
        return next()
      }
      if (/\.babelrc&/.test(name)) {
        hasBabelrc = true
      }
      doConvert(filePath, filePath.replace(src, qaSrc), next)
    })
    walker.on('errors', function (root, nodeStatsArray, next) {
      throw new Error('copy file error')
    })
    walker.on('end', function (root, nodeStatsArray, next) {
      if (option.watch === true) {
        // watch模式下，hap-toolkit将webpack以同步子进程的方式执行，
        // 文件变化的监听会被阻塞，因此需要在子进程中监听文件变化
        childProcess.fork(path.join(__dirname, 'utils/watchFile.js'))
      }
      if (!hasBabelrc) {
        fsExtra.outputFileSync(qaSrc + '/.babelrc', `{
  "presets": [
    ["env", { "modules": false }],
    "stage-3"
  ]
}`)
      }
      cb()
    })
  })
}
