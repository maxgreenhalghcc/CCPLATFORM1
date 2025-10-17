import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';

const HEADER = 'x-request-id';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    const incoming = (req.headers?.[HEADER] ?? '').toString().trim();
    const id = incoming.length > 0 ? incoming : randomUUID();
    req.requestId = id;
    if (typeof res.setHeader === 'function') {
      res.setHeader(HEADER, id);
    }
    next();
  }
}
