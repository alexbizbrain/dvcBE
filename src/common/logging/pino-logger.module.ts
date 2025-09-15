import { Global, Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'crypto';

const isProd = (process.env.NODE_ENV ?? 'development') === 'production';

@Global()
@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: isProd ? 'info' : 'debug',

        transport: !isProd
          ? {
              target: 'pino-pretty',
              options: {
                colorize: true,
                singleLine: true,
                translateTime: 'yyyy-mm-dd HH:MM:ss.l Z',
                ignore: 'pid,hostname',
              },
            }
          : undefined,

        // Correlation ID (X-Request-Id)
        genReqId: (req, res) => {
          const headerId = req.headers['x-request-id'] as string | undefined;
          const id = headerId || randomUUID();
          res.setHeader('x-request-id', id);
          // nestjs-pino assigns req.id so you can use req.id in logs
          return id;
        },

        // Add common props to every log line
        customProps: (req) => ({
          requestId: (req as any).id,
          userId: (req as any).user?.id,
        }),

        // Auto HTTP logging; skip super-noisy paths if you want
        autoLogging: {
          ignore: (req) => req.url === '/health' || req.url === '/favicon.ico',
        },

        // Don’t leak secrets in logs
        redact: {
          paths: [
            'req.headers.authorization',
            'req.body.password',
            'req.body.otp',
            'req.body.token',
            'req.body.accessToken',
            'res.headers["set-cookie"]',
          ],
          remove: true,
        },
      },
    }),
  ],
  exports: [LoggerModule],
})
export class PinoLoggerModule {}
