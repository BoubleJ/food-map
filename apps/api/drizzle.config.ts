import { existsSync } from "node:fs";
import { defineConfig } from "drizzle-kit";

const envFileSuffix: Record<string, string> = { development: "dev", production: "prod" };
const nodeEnv = process.env.NODE_ENV ?? "development";

for (const envFile of ["../../.env", `../../.env.${envFileSuffix[nodeEnv] ?? nodeEnv}`]) {
  if (existsSync(envFile)) process.loadEnvFile(envFile);
}

export default defineConfig({
  schema: "./src/database/schema/*.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://foodmap:foodmap@localhost:5432/foodmap",
  },
  extensionsFilters: ["postgis"],
});
