import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { validateEnv } from "@/config/env";

const envFileSuffix: Record<string, string> = { development: "dev", production: "prod" };
const nodeEnv = process.env.NODE_ENV ?? "development";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: ["../../.env", `../../.env.${envFileSuffix[nodeEnv] ?? nodeEnv}`],
      validate: validateEnv,
    }),
  ],
})
export class AppConfigModule {}
