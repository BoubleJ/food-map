import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { validateEnv } from "./env";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: [
        `../../.env.${process.env.NODE_ENV ?? "development"}`,
        "../../.env",
      ],
      validate: validateEnv,
    }),
  ],
})
export class AppConfigModule {}
