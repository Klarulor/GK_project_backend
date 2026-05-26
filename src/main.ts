import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { ValidationPipe } from "@nestjs/common";
import { loggerConfig } from "./logger/logger.config";
import { WinstonModule } from "nest-winston";

async function bootstrap() {
  console.log(
    JSON.stringify({
      level: "info",
      event: "APPLICATION_BOOTSTRAP_STARTED",
      version: "a1",
    }),
  );
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger(loggerConfig),
  });

  app.getHttpAdapter().getInstance().set("trust proxy", 1);

  app.enableCors();

  const options = new DocumentBuilder()
    .setTitle("EECS API Documentation")
    //.setDescription('The cats API description')
    .setVersion("1.0")
    //.addTag('cats')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup("api", app, document);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap().catch((error) =>
  console.error(
    JSON.stringify({
      level: "critical",
      event: "APPLICATION_STARTUP_FAILED",
      message: error instanceof Error ? error.message : "Unknown startup error",
      stack: error instanceof Error ? error.stack : undefined,
    }),
  ),
);
