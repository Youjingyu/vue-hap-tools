const chalk = require('chalk')

const log = console.log

module.exports = {
  info (msg) {
    log(chalk.green(msg))
  },
  warn (msg) {
    log(chalk.rgb(255, 250, 120).bold(msg))
  },
  error (msg) {
    log(chalk.rgb(238, 119, 109).bold(msg))
  }
}
