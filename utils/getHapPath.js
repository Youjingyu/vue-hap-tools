const fs = require('fs')
const path = require('path')

module.exports = function () {
  let hapPath = path.resolve(process.cwd(), './node_modules/hap-toolkit')
  hapPath = fs.existsSync(hapPath)
    ? hapPath : path.resolve(process.cwd(), './node_modules/vue-hap-tools/node_modules/hap-toolkit')

  return hapPath
}
