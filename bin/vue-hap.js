const path = require('path')
const program = require('commander')
// const chalk = require('chalk')
const hapPath = require('../utils/getHapPath')()
const hapToolKit = require(path.join(hapPath, 'commands'))
const convert = require('../index')
const fixRoutes = require('../utils/fixSrcDir').fixRoutes

program
  .version(require('../package').version)
  .usage('<command> [options]')

program.command('build')
  .description(' build the project')
  .action(function () {
    convert({watch: false}, () => {
      hapToolKit.build()
    })
  })
program.command('watch')
  .description('recompile project while file changes')
  .action(function () {
    convert({watch: true}, () => {
      hapToolKit.watch()
    })
  })
program.command('server')
  .description('open server for project')
  .action(function () {
    fixRoutes((err) => {
      if (err) throw err
      hapToolKit.server()
    })
  })
program.command('release')
  .description('release the project')
  .action(function () {
    convert({watch: false}, () => {
      hapToolKit.release()
    })
  })
program.command('debug')
  .description('debug the project')
  .action(function () {
    fixRoutes((err) => {
      if (err) throw err
      hapToolKit.debug()
    })
  })

program.parse(process.argv)
