import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './common/http/filters/http-exception.filter';
import { TransformInterceptor } from './common/http/interceptors/transform.interceptor';
import { TimeoutInterceptor } from './common/http/interceptors/timeout.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  console.log('--- STDOUT TEST ---', {
    isTTY: process.stdout.isTTY,
    writable: process.stdout.writable,
    fd: process.stdout.fd,
  });

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
    new TransformInterceptor(),
    new TimeoutInterceptor(),
  );

  // Enable CORS if needed for frontend
  app.enableCors();

  const port = parseInt(process.env.PORT ?? '4000', 10);

  await app.listen(port);
}
bootstrap();
