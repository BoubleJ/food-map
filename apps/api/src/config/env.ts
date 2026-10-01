import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  API_PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().url(),
  CORS_ORIGINS: z.string().default(""),
  KAKAO_REST_API_KEY: z.string().min(1),
  JUSO_SEARCH_API_KEY: z.string().min(1),
  JUSO_COORD_API_KEY: z.string().min(1),
});

type Env = z.infer<typeof envSchema> & { corsOrigins: string[] };

export function validateEnv(raw: Record<string, unknown>): Env {
  const parsed = envSchema.parse(raw);
  return {
    ...parsed,
    corsOrigins: parsed.CORS_ORIGINS.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  };
}
