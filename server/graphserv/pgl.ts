import {getPreset} from "~~/server/graphile.config"
import {postgraphile} from "postgraphile"

import { authPgPool, rootPgPool } from "../utils/pg"


export const pgl = postgraphile(getPreset({
  authPgPool,
  rootPgPool,
}))
