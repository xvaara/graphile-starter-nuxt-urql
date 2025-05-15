import { grafserv } from "postgraphile/grafserv/h3/v1";
import { pgl } from "./pgl"
import { getPreset } from "~~/server/graphile.config";

export const serv = grafserv({preset: getPreset({
      authPgPool,
      rootPgPool,
    }), schema: pgl.getSchema()})
