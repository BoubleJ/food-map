import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  KAKAO_REST_API_KEY: z.string().min(1),
  JUSO_SEARCH_API_KEY: z.string().min(1),
  JUSO_COORD_API_KEY: z.string().min(1),
});

export function validateEnv(raw: Record<string, unknown>) {
  return envSchema.parse(raw);
}
