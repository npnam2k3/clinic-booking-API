import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { RESPONSE_MESSAGE_METADATA } from 'src/common/decorators/response.decorator';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    return next.handle().pipe(
      map((data) => ({
        status: true,
        statusCode: context.switchToHttp().getResponse().statusCode,
        message:
          this.reflector.get<string>(
            RESPONSE_MESSAGE_METADATA,
            context.getHandler(),
          ) || 'Success',
        data,
        timestamp: new Date().toISOString(),
      })),
      catchError((err) => {
        // console.error('Lỗi xảy ra trong request:', err);
        return throwError(() => err);
      }),
    );
  }
}
