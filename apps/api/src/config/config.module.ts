import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { validateEnv } from "@/config/env";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: "../../.env.local",
      validate: validateEnv,
    }),
  ],
})
export class AppConfigModule {}
