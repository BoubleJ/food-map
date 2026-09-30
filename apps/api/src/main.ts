import "reflect-metadata";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "@/app.module";
import { configureApp } from "@/configure-app";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  configureApp(app);
  app.enableShutdownHooks();

  await app.listen(app.get(ConfigService).get<number>("API_PORT") ?? 4000, "0.0.0.0");
}

void bootstrap();
