import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/database/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://foodmap:foodmap@localhost:5432/foodmap",
  },
  // PostGIS 가 만드는 내부 테이블은 drizzle 이 건드리지 않게 막는다.
  extensionsFilters: ["postgis"],
});
