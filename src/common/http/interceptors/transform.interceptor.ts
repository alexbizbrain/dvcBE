import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { map, Observable } from 'rxjs';

export const RAW_RESPONSE_KEY = 'raw_response';
export const RawResponse = () => SetMetadata(RAW_RESPONSE_KEY, true);

function isAlreadyEnveloped(payload: any): boolean {
  // Consider it “enveloped” if it contains a success flag AND a data key.
  return (
    !!payload &&
    typeof payload === 'object' &&
    'success' in payload &&
    'data' in payload
  );
}

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> {
    const isRaw = this.reflector.getAllAndOverride<boolean>(RAW_RESPONSE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    return next.handle().pipe(
      map((payload) => {
        // 1) Explicitly skip (for file streams, proxies, etc.)
        if (isRaw) return payload;

        // 2) If the handler already built { success, data, ... } keep it as-is
        if (isAlreadyEnveloped(payload)) return payload;

        // 3) Otherwise, wrap once to the unified shape
        return {
          success: true,
          data: payload,
        };
      }),
    );
  }
}
