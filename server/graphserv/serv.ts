import { grafserv } from "postgraphile/grafserv/h3/v1";
import { pgl } from "./pgl"
import { preset } from "~/graphile.config";

export const serv = grafserv({preset,schema: pgl.getSchema()})