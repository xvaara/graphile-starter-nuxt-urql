import { Pool } from "pg";

function swallowPoolError(_error: Error) {
  /* noop */
}

export const rootPgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  rootPgPool.on("error", swallowPoolError);
  // nitro.set("rootPgPool", rootPgPool);

  // This pool runs as the unprivileged user, it's what PostGraphile uses.
  export const authPgPool = new Pool({
    connectionString: process.env.AUTH_DATABASE_URL,
  });
  authPgPool.on("error", swallowPoolError);
  // nitro.set("authPgPool", authPgPool);
