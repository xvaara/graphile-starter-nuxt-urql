#!/usr/bin/env node
const { spawn } = require('node:child_process')
const fs = require('node:fs')

const ENVFILE = `${import.meta.dirname}/../.env`

if (!fs.existsSync(ENVFILE)) {
  console.error('🛠️  Please run \'yarn setup\' before running \'yarn start\'')
  process.exit(1)
}

spawn('yarn', ['dev'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    // YARN_SILENT: "1",
    npm_config_loglevel: 'silent',
  },
  shell: true,
})
