#!/usr/bin/env node
import fs from 'node:fs'

try {
  fs.unlinkSync(`${import.meta.dirname}/../.env`)
}
catch {
  /* NOOP */
}
