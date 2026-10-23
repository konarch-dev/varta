import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import express from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('VartaBootstrap');
  const app = await NestFactory.create(AppModule);

  // Global prefix for all REST routes
  app.setGlobalPrefix('api/v1');

  // Cookie parser for secure HttpOnly session tokens
  app.use(cookieParser());

  // Input validation & sanitization
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // CORS Configuration
  const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
    ? process.env.CORS_ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : ['http://localhost:3000', 'http://127.0.0.1:3000'];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Static uploads directory serving
  const uploadDir = path.isAbsolute(process.env.MEDIA_UPLOAD_DIR || '')
    ? process.env.MEDIA_UPLOAD_DIR!
    : path.resolve(process.cwd(), process.env.MEDIA_UPLOAD_DIR || './uploads');

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  const avatarsDir = path.join(uploadDir, 'avatars');
  const coversDir = path.join(uploadDir, 'covers');
  const postsDir = path.join(uploadDir, 'posts');
  if (!fs.existsSync(avatarsDir)) fs.mkdirSync(avatarsDir, { recursive: true });
  if (!fs.existsSync(coversDir)) fs.mkdirSync(coversDir, { recursive: true });
  if (!fs.existsSync(postsDir)) fs.mkdirSync(postsDir, { recursive: true });

  app.use('/uploads', express.static(uploadDir));
  app.use('/api/v1/uploads', express.static(uploadDir));

  // Swagger OpenAPI Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('VARTA API — Baat Sabki')
    .setDescription(
      'Official REST and Real-Time WebSocket API specification for VARTA social networking platform.',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('Health', 'Infrastructure and service health probes')
    .addTag('Authentication', 'User registration, login, session rotation')
    .addTag('Users & Profiles', 'User profile management, privacy settings')
    .addTag('Posts & Interactions', 'Post creation, threaded replies, likes, reposts, polls')
    .addTag('Feeds', 'Following and algorithmic For You discovery feeds')
    .addTag('Social Relationships', 'Follows, follow requests, blocks, mutes')
    .addTag('Explore & Search', 'Full-text search and trending hashtags')
    .addTag('Notifications', 'User alerts and preferences')
    .addTag('Direct Messages', '1-to-1 conversation history and messaging')
    .addTag('Moderation & Admin', 'IT Intermediary Rules grievance handling & review queue')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'VARTA API Documentation',
  });

  const port = process.env.PORT_API || process.env.PORT || 3001;
  await app.listen(port);
  logger.log(`🚀 VARTA Backend API running on: http://localhost:${port}/api/v1`);
  logger.log(`📚 Swagger documentation available at: http://localhost:${port}/api/docs`);
}

bootstrap();
