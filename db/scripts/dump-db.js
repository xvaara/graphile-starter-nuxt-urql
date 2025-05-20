import { spawn } from 'node:child_process'
import { resolve } from 'node:path'

const schemaPath = resolve(import.meta.dirname, '../../data/schema.sql')

if (process.env.IN_TESTS === '1') {
  process.exit(0)
}

const connectionString = process.env.GM_DBURL
if (!connectionString) {
  console.error(
    'This script should only be called from a graphile-migrate action.',
  )
  process.exit(1)
}

const dumpProcess = spawn(
  process.env.PG_DUMP || 'pg_dump',
  [
    '--no-sync',
    '--schema-only',
    '--no-owner',
    '--exclude-schema=graphile_migrate',
    '--exclude-schema=graphile_worker',
    `--file=${schemaPath}`,
    connectionString,
  ],
  {
    stdio: 'inherit',
    shell: true,
  },
)
dumpProcess.on('close', code => process.exit(code))
