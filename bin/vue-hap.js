#!/usr/bin/env node

'use strict'

const chalk = require('chalk');
const semver = require('semver');
const spawn = require('cross-spawn');
const requiredVersion = require('../package.json').engines.node;

if (!semver.satisfies(process.version, requiredVersion)) {
  console.log(
    chalk.red(
      `You are using Node ${
        process.version
      }, but vue-cli-service requires Node ${requiredVersion}.\nPlease upgrade your Node version.\n`
    )
  );
  process.exit(1);
}

const args = process.argv.slice(2);

const argMap = {
  "build": ["NODE_PLATFORM=na", "NODE_PHASE=dv", "webpack", "--config", "./node_modules/vue-hap-tools/webpack.config.js"],
  "release": ["NODE_PLATFORM=na", "NODE_PHASE=ol", "webpack", "--config", "./node_modules/vue-hap-tools/webpack.config.js"],
  "server": ["NODE_MOUNTED_ROUTER=\"debug bundle\"", "node", "./node_modules/vue-hap-tools/debugger/server/index.js"],
  "watch": ["NODE_PLATFORM=na", "NODE_PHASE=dv", "webpack", "--config", "./node_modules/vue-hap-tools/webpack.config.js", "--watch"],
  "dev": ["NODE_PLATFORM=na", "NODE_PHASE=dv", "NODE_MODE=dev", "webpack", "--config", "./node_modules/vue-hap-tools/webpack.config.js", "--watch"]  
}

const crossArgs = argMap[args[0]];

if(!crossArgs) {
  console.log('Unknown script "' + args[0] + '".')
  process.exit(0)
} else{
  const result = spawn.sync(
    'cross-env',
    crossArgs,
    { stdio: 'inherit'}
  );
  if (result.signal) {
    if (result.signal === 'SIGKILL') {
      console.log(
        'The build failed because the process exited too early. ' +
          'This probably means the system ran out of memory or someone called ' +
          '`kill -9` on the process.'
      )
    } else if (result.signal === 'SIGTERM') {
      console.log(
        'The build failed because the process exited too early. ' +
          'Someone might have called `kill` or `killall`, or the system could ' +
          'be shutting down.'
      )
    }
    process.exit(1)
  }
  process.exit(result.status)
}
