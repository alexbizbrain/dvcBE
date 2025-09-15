import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response, Request } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const isHttp = exception instanceof HttpException;
    const status = isHttp
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const payload = isHttp
      ? exception.getResponse()
      : {
          message: 'Internal server error',
        };

    res.status(status).json({
      success: false,
      statusCode: status,
      path: req.url,
      timestamp: new Date().toISOString(),
      error: payload,
    });
  }
}
