import { grafserv } from 'postgraphile/grafserv/h3/v1'
import { getPreset } from '~~/server/graphile.config'
import { authPgPool, rootPgPool } from '../utils/pg'
import { pgl } from './pgl'

export const serv = grafserv({ preset: getPreset({
  authPgPool,
  rootPgPool,
}), schema: pgl.getSchema() })
