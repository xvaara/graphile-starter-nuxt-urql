#!/usr/bin/env node
import path from 'node:path'
import { globSync } from 'glob'
import rimraf from 'rimraf'

try {
  await rimraf(globSync(path.join(import.meta.dirname, '../.nuxt')))
  await rimraf(globSync(path.join(import.meta.dirname, '../.output')))
  await rimraf(globSync(path.join(import.meta.dirname, '../node_modules/.cache')))
  console.log('Deleted')
}
catch (e) {
  console.error('Failed to clean up, perhaps rimraf isn\'t installed?')
  console.error(e)
}
