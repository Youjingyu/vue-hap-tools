const chalk = require('chalk')

let currentFile = ''
const log = console.log

module.exports = {
  info (msg, position) {
    log(chalk.green(formatMsg('INFO', msg, position)))
  },
  warn (msg, position) {
    log(chalk.rgb(255, 250, 120).bold(formatMsg('WARN', msg, position)))
  },
  error (msg, position) {
    log(chalk.rgb(238, 119, 109).bold(formatMsg('ERROR', msg, position)))
  },
  setFile (file) {
    currentFile = file
  }
}

function formatMsg (type, msg, position) {
  const file = currentFile ? currentFile + ' ' : ''
  msg = `[${type}] ${file}${type}: ${msg}`
  if (position && position.line !== undefined && position.column !== undefined) {
    msg += ` @${position.line}:${position.column}`
  }
  return msg
}
