import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/database/schema/*.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://foodmap:foodmap@localhost:5432/foodmap",
  },
  extensionsFilters: ["postgis"],
});
