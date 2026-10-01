import { existsSync } from "node:fs";
import { defineConfig } from "drizzle-kit";

if (existsSync("../../.env.local")) process.loadEnvFile("../../.env.local");

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL 이 없습니다. 루트 .env.local 을 확인해주세요.");

export default defineConfig({
  schema: "./src/database/schema/*.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: databaseUrl },
  extensionsFilters: ["postgis"],
});
