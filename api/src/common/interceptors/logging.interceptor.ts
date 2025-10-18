import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import * as Sentry from '@sentry/node';

const HEADER = 'x-request-id';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req: any = http.getRequest();
    const res: any = http.getResponse();
    const { method, url } = req;
    const userId = req?.user?.id ?? null;
    const requestId = req?.requestId ?? res?.getHeader?.(HEADER);
    const start = Date.now();

    if (req?.log && typeof req.log.child === 'function') {
      req.log = req.log.child({ requestId, userId });
    }

    if (process.env.SENTRY_DSN && requestId) {
      Sentry.configureScope((scope) => {
        scope.setTag('request_id', requestId);
        if (userId) {
          scope.setUser({ id: userId });
        }
      });
    }

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - start;
          const log = req?.log ?? console;
          if (typeof log.info === 'function') {
            log.info({ requestId, userId, method, url, duration }, 'request completed');
          } else if (typeof log.log === 'function') {
            log.log(
              `request completed ${method} ${url} ${duration}ms id=${requestId ?? 'n/a'} user=${
                userId ?? 'anonymous'
              }`
            );
          }
        }
      })
    );
  }
}
