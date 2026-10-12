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

  // CORS — allow web (localhost) and the mobile app (any LAN origin / native
  // requests which send no Origin header). Reflecting the request origin keeps
  // credentials working while letting phones on the LAN reach the API.
  app.enableCors({
    origin: true,
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

  // Public, unauthenticated health check — handy for verifying the phone can
  // reach the API from a browser (open http://<laptop-ip>:7002/health).
  const http = app.getHttpAdapter();
  http.get('/health', (_req: any, res: any) =>
    res.json({ ok: true, service: 'quilo-api', time: new Date().toISOString() }),
  );

  const port = process.env.PORT || 7002;
  // Bind to 0.0.0.0 so phones/other devices on the LAN can reach the API,
  // not just localhost on this PC.
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Quilo API running on port ${port} (0.0.0.0)`);
}
bootstrap();
