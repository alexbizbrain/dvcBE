import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(_ctx: ExecutionContext, next: CallHandler<any>): Observable<any> {
    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
      })),
    );
  }
}
