import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  API_PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().optional(),
  JWT_SECRET: z.string().min(8),
  JWT_ACCESS_TTL: z.string().default("15m"),
  JWT_REFRESH_TTL: z.string().default("30d"),
  COOKIE_DOMAIN: z.string().default("localhost"),
  CORS_ORIGINS: z.string().default(""),
});

export type Env = z.infer<typeof envSchema> & { corsOrigins: string[] };

/** 부팅 시점에 환경 변수를 한 번만 검증한다. 빠진 값이 있으면 여기서 죽는다. */
export function validateEnv(raw: Record<string, unknown>): Env {
  const parsed = envSchema.parse(raw);
  return {
    ...parsed,
    corsOrigins: parsed.CORS_ORIGINS.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  };
}
