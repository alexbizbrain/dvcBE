import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './common/http/filters/http-exception.filter';
import { TransformInterceptor } from './common/http/interceptors/transform.interceptor';
import { TimeoutInterceptor } from './common/http/interceptors/timeout.interceptor';
import { Logger } from 'nestjs-pino';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  console.log('--- STDOUT TEST ---', {
    isTTY: process.stdout.isTTY,
    writable: process.stdout.writable,
    fd: process.stdout.fd,
  });

  app.useLogger(app.get(Logger));
  app.use(cookieParser());

  // Enable global validation
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(
    new TransformInterceptor(app.get(Reflector)),
    new TimeoutInterceptor(),
  );

  // Enable CORS for frontend with credentials (cookies)
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'http://staging.myfreecarvalue.com',
    'https://staging.myfreecarvalue.com',
    'http://54.177.40.224',
  ];
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  const port = parseInt(process.env.PORT ?? '4000', 10);

  await app.listen(port);
}
bootstrap();
