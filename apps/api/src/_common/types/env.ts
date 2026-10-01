import type { validateEnv } from "@/config/env";

export type Env = ReturnType<typeof validateEnv>;
