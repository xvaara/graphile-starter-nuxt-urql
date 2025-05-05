// @ts-check
import { makePgService } from "@dataplan/pg/adaptors/pg";
import { PostGraphileAmberPreset} from "postgraphile/presets/amber";
import { makeV4Preset } from "postgraphile/presets/v4";
import { makePgSmartTagsFromFilePlugin } from "postgraphile/utils";
import { PostGraphileConnectionFilterPreset } from "postgraphile-plugin-connection-filter";
import { PgAggregatesPreset } from "@graphile/pg-aggregates";
import { PgManyToManyPreset } from "@graphile-contrib/pg-many-to-many";
import { PgSimplifyInflectionPreset } from "@graphile/simplify-inflection";
// import { PersistedPlugin } from "@grafserv/persisted";
import { PgOmitArchivedPlugin } from "@graphile-contrib/pg-omit-archived";
import { resolve } from "path";

import { NodePlugin } from "graphile-build";





// For configuration file details, see: https://postgraphile.org/postgraphile/next/config

const TagsFilePlugin = makePgSmartTagsFromFilePlugin(resolve(`./tags.json5`));

/** @satisfies {GraphileConfig.Preset} */
export const preset = {
  extends: [
    PostGraphileAmberPreset,
    makeV4Preset({
      /* Enter your V4 options here */
      graphiql: true,
      graphiqlRoute: "/api/ruru",
      skipPlugins: [
        NodePlugin
      ],
    }),
    PostGraphileConnectionFilterPreset,
    PgManyToManyPreset,
    PgAggregatesPreset,
    PgSimplifyInflectionPreset
  ],
  plugins: [
    // PersistedPlugin, 
    PgOmitArchivedPlugin, 
    TagsFilePlugin
  ],
 
  pgServices: [
    makePgService({
      // Database connection string:
      connectionString: process.env.DATABASE_URL,
      superuserConnectionString:
        process.env.SUPERUSER_DATABASE_URL ?? process.env.DATABASE_URL,
      // List of schemas to expose:
      schemas: process.env.DATABASE_SCHEMAS?.split(",") ?? ["public"],
      // Enable LISTEN/NOTIFY:
      pubsub: true,
    }),
  ],
  grafserv: {
    port: 5678,
    websockets: true,
    allowUnpersistedOperation: true,
    watch: true,
    graphqlPath: "/api/graphql",
  },
  grafast: {
    explain: true,
  },
  ruru: {endpoint: "/api/ruru"}
};
