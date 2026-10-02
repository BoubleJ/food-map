import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DrizzleModule } from "@nestjs/drizzle";
import { drizzle } from "drizzle-orm/postgres-js";
import { AdminModule } from "@/admin/admin.module";
import { AppConfigModule } from "@/config/config.module";
import type { Env } from "@/_common/types/env";
import { HealthController } from "@/health/health.controller";
import { AppOrpcModule } from "@/orpc/orpc.module";

@Module({
  imports: [
    AppConfigModule,
    AppOrpcModule,
    AdminModule,
    DrizzleModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        drizzle,
        connection: { url: config.get("DATABASE_URL", { infer: true }), max: 10 },
      }),
    }),
  ],
  controllers: [HealthController],
})
export class AppModule {}
