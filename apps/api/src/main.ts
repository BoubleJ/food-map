import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { AppModule } from "./app.module";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.use(helmet());
  app.use(cookieParser());
  app.setGlobalPrefix("api");
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableShutdownHooks();

  // JWT 를 httpOnly 쿠키로 주고받으므로 credentials 를 열어 둔다.
  app.enableCors({
    origin: config.get<string[]>("corsOrigins") ?? [],
    credentials: true,
  });

  await app.listen(config.get<number>("API_PORT") ?? 4000, "0.0.0.0");
}

void bootstrap();
