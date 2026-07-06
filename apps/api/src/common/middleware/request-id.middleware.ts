import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  // Use 'any' type for req and res to resolve property access issues with Express types (headers, setHeader) in the current environment
  use(req: any, res: any, next: NextFunction) {
    const requestId = req.headers['x-request-id'] || uuidv4();
    req['requestId'] = requestId;
    res.setHeader('x-request-id', requestId as string);
    next();
  }
}
