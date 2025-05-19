#!/usr/bin/env node
const fs = require('node:fs')

try {
  fs.unlinkSync(`${import.meta.dirname}/../.env`)
}
catch {
  /* NOOP */
}
