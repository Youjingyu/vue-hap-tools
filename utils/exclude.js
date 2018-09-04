const fsExtra = require('fs-extra')
const minimatch = require('minimatch')

const { src } = require('./getSrcDir')
const manifest = fsExtra.readJsonSync(src + '/manifest.json')
const exclude = manifest['vue-hap-ignore'] || []

module.exports = function (path) {
  const relativePath = path.replace(src, '').replace(/^\//, '')
  return exclude.some((rule) => {
    return minimatch(relativePath, rule)
  })
}
