import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe.
  // NOTE: `whitelist`/`forbidNonWhitelisted` are intentionally OFF — every
  // DTO in this codebase (fee, exam, attendance, timetable, assignment,
  // student, teacher, library, transport, settings, super-admin) is a
  // plain class with no class-validator decorators. With those options on,
  // class-validator has no decorator metadata to whitelist against, so it
  // strips (or outright rejects) every property on every DTO — silently
  // breaking every POST/PUT endpoint's request body across the entire API.
  // `transform` stays on so query params still get their implicit type
  // coercion (e.g. numeric query strings -> number).
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // CORS
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  });

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Quilo API')
    .setDescription('Quilo — Multi-Tenant SaaS ERP API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 7002;
  await app.listen(port);
  console.log(`🚀 Quilo API running on port ${port}`);
}
bootstrap();
