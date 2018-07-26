const chokidar = require('chokidar')
const doConvert = require('./doConvert')
const { src, qaSrc } = require('./getSrcDir')

chokidar.watch(src).on('change', (filePath) => {
  const qaPath = filePath.replace(src, qaSrc)
  doConvert(filePath, qaPath)
})
