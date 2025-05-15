import { run } from "graphile-worker";
import preset from "./graphile.config";

async function main() {
  const runner = await run({ preset });
  await runner.promise;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
