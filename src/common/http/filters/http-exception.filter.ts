import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Response, Request } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly isDev =
    (process.env.NODE_ENV ?? 'development') === 'development';
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const requestId =
      req.id || (req.headers['x-request-id'] as string | undefined);
    const path = req.originalUrl || req.url;

    let status: number;
    let message: any;
    let name = 'Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resp = exception.getResponse();
      message =
        typeof resp === 'string' ? resp : ((resp as any).message ?? resp);
      name = exception.name;
    } else if (this.isPrismaError(exception)) {
      const { httpStatus, clientMessage, code } =
        this.mapPrismaError(exception);
      status = httpStatus;
      message = clientMessage;
      name = `PrismaError: (${code})`;
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      name = 'Error';
    }

    req.log?.error(
      {
        err: exception,
        requestId,
        method: req.method,
        path,
        status,
      },
      'Unhandled exception',
    );

    const payload: any = {
      success: false,
      statusCode: status,
      error: name,
      message,
      path,
      method: req.method,
      timestamp: new Date().toISOString(),
      requestId,
    };

    if (this.isDev) {
      payload.debug = { query: req.query, body: req.body };
      if ((exception as any)?.stack) payload.stack = (exception as any).stack;
      if (this.isPrismaError(exception)) {
        payload.prisma = {
          code: exception.code,
          meta: exception.meta,
        };
      }
    }

    res.status(status).json(payload);
  }

  private isPrismaError(e: any): e is Prisma.PrismaClientKnownRequestError {
    return (
      !!e &&
      typeof e === 'object' &&
      typeof e.code === 'string' &&
      e.code.startsWith('P')
    );
  }

  private mapPrismaError(e: Prisma.PrismaClientKnownRequestError) {
    switch (e.code) {
      case 'P2002':
        return {
          httpStatus: 409,
          clientMessage: 'Duplicate resource',
          code: e.code,
        };
      case 'P2025':
        return {
          httpStatus: 404,
          clientMessage: 'Resource not found',
          code: e.code,
        };
      case 'P2003':
        return {
          httpStatus: 400,
          clientMessage: 'Related resource constraint failed',
          code: e.code,
        };
      default:
        return {
          httpStatus: 400,
          clientMessage: 'Database error',
          code: e.code,
        };
    }
  }
}
