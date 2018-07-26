const fs = require('fs')
const path = require('path')
const getHapPath = require('./getHapPath')

const hapWebpackConfigPath = path.join(getHapPath(), 'tools/webpack.config.js')
const routesPath = path.join(getHapPath(), 'tools/packager/router/routes/index.js')

module.exports = {
  fixWebpackConfig (cb = () => {}) {
    fs.readFile(hapWebpackConfigPath, 'utf8', (err, fileContent) => {
      if (err) return cb(err)
      // 为路径添加qa-前缀
      fileContent = fileContent.replace(/'(src|dist|build)'/g, `'qa-$1'`)
      fs.writeFile(hapWebpackConfigPath, fileContent, (err) => {
        if (err) return cb(err)
        cb(null)
      })
    })
  },
  fixRoutes (cb = () => {}) {
    fs.readFile(routesPath, 'utf8', (err, fileContent) => {
      if (err) return cb(err)
      // 为路径添加qa-前缀
      fileContent = fileContent.replace('_path2.default.join(n, "dist")', '_path2.default.join(n, "qa-dist")')
      fs.writeFile(routesPath, fileContent, (err) => {
        if (err) return cb(err)
        cb(null)
      })
    })
  }
}
