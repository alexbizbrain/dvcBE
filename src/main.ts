import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
  logger: ['error', 'warn', 'log', 'debug', 'verbose'],
});

console.log('--- STDOUT TEST ---', {
  isTTY: process.stdout.isTTY,
  writable: process.stdout.writable,
  fd: process.stdout.fd
});


  // Enable global validation
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Enable CORS if needed for frontend
  app.enableCors();

  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
