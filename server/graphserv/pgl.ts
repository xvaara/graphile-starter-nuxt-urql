import { postgraphile } from 'postgraphile'
import { getPreset } from '~~/server/graphile.config'

import { authPgPool, rootPgPool } from '../utils/pg'

export const pgl = postgraphile(getPreset({
  authPgPool,
  rootPgPool,
}))
