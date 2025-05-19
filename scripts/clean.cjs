#!/usr/bin/env node
const path = require('node:path')
const { globSync } = require('glob')
const { default: rimraf } = require('rimraf')

try {
  await rimraf(globSync(path.join(import.meta.dirname, '../@app/*/dist')))
  await rimraf(globSync(path.join(import.meta.dirname, '../@app/*/tsconfig.tsbuildinfo')))
  await rimraf(globSync(path.join(import.meta.dirname, '../@app/client/.next')))
  console.log('Deleted')
}
catch (e) {
  console.error('Failed to clean up, perhaps rimraf isn\'t installed?')
  console.error(e)
}
