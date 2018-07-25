const fs = require('fs')
const path = require('path')
const fsExtra = require('fs-extra')
const walk = require('walk')
const convert = require('./convert')

fsExtra.emptyDirSync('./qa-build')
fsExtra.copySync('./_test', './qa-build')

const walker = walk.walk(path.resolve(__dirname, './qa-build'))
walker.on('file', (root, fileStats, next) => {
  if (/\.vue$/.test(fileStats.name)) {
    console.log(fileStats.name)
    const filePath = path.resolve(root, fileStats.name)
    fs.readFile(filePath, 'utf8', (err, fileContent) => {
      if (err) throw err
      fs.writeFile(filePath.replace(/\.vue$/, '.ux'), convert(fileContent), function (err) {
        if (err) throw err
        fsExtra.removeSync(filePath)
      })
    })
  }
  next()
})
walker.on('errors', function (root, nodeStatsArray, next) {
  console.log(nodeStatsArray)
  next()
})

walker.on('end', function () {
  console.log('all done')
})
