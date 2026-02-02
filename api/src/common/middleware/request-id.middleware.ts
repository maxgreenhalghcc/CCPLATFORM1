import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response } from 'express';
import { randomUUID } from 'crypto';

const HEADER = 'x-request-id';

type RequestWithId = Request & { requestId?: string };

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: RequestWithId, res: Response, next: () => void) {
    const incoming = (req.headers?.[HEADER] ?? '').toString().trim();
    const id = incoming.length > 0 ? incoming : randomUUID();
    req.requestId = id;
    if (typeof res.setHeader === 'function') {
      res.setHeader(HEADER, id);
    }
    next();
  }
}
