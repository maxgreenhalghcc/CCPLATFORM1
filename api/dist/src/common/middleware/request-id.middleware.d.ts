import { NestMiddleware } from '@nestjs/common';
import type { Request, Response } from 'express';
type RequestWithId = Request & {
    requestId?: string;
};
export declare class RequestIdMiddleware implements NestMiddleware {
    use(req: RequestWithId, res: Response, next: () => void): void;
}
export {};
