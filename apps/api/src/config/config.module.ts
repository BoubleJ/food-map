import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { validateEnv } from "./env";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      // 루트의 .env.development / .env.production 을 읽는다.
      envFilePath: [
        `../../.env.${process.env.NODE_ENV ?? "development"}`,
        "../../.env",
      ],
      validate: validateEnv,
    }),
  ],
})
export class AppConfigModule {}
