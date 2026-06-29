import { config } from "dotenv";
import { purgeMock, runSeed } from "./runner";

// DB tooling loads the repo-root env (cwd is packages/db under the pnpm filter).
config({ path: "../../.env.local" });
config({ path: "../../.env" });

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set. Put it in the repo-root .env.local (Neon + PostGIS).");
    process.exit(1);
  }
  if (process.argv.includes("--purge-mock")) {
    await purgeMock(url);
    console.log("Purged source='mock' listings.");
    return;
  }
  const result = await runSeed(url);
  console.log("Seed complete:", JSON.stringify(result, null, 2));
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
