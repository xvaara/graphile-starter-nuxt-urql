#!/usr/bin/env node
import { spawn } from 'node:child_process'
import fs from 'node:fs'

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
