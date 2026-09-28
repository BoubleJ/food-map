import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DrizzleModule } from "@nestjs/drizzle";
import { drizzle } from "drizzle-orm/postgres-js";
import { AdminModule } from "@/admin/admin.module";
import { AppConfigModule } from "@/config/config.module";
import { HealthController } from "@/health/health.controller";

@Module({
  imports: [
    AppConfigModule,
    AdminModule,
    DrizzleModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        drizzle,
        connection: { url: config.getOrThrow<string>("DATABASE_URL"), max: 10 },
      }),
    }),
  ],
  controllers: [HealthController],
})
export class AppModule {}
