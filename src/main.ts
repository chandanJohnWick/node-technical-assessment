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

  await app.register(multipart, {
    limits: {
      files: 1,
      fileSize: config.get<number>('UPLOAD_MAX_BYTES', 20 * 1024 * 1024),
    },
  });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  const port = config.get<number>('PORT', 3000);
  await app.listen(port, '0.0.0.0');
  console.log('Policy API listening on port ' + port);
}

void bootstrap();
