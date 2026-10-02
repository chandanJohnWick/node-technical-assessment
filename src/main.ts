import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import multipart from '@fastify/multipart';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true, bodyLimit: 1024 * 1024 }),
  );
  const config = app.get(ConfigService);
  // Environment values are strings; Fastify's multipart parser requires a number.
  const uploadMaxBytes = Number(config.get<string | number>('UPLOAD_MAX_BYTES') ?? 20 * 1024 * 1024);
  if (!Number.isSafeInteger(uploadMaxBytes) || uploadMaxBytes <= 0) {
    throw new Error('UPLOAD_MAX_BYTES must be a positive integer');
  }

  await app.register(multipart, {
    limits: {
      files: 1,
      fileSize: uploadMaxBytes,
    },
  });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  // Environment variables are strings; coerce Render's PORT to a TCP port number.
  const port = Number(config.get<string | number>('PORT', 3000));
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }
  await app.listen(port, '0.0.0.0');
  console.log('Policy API listening on port ' + port);
}

void bootstrap();
