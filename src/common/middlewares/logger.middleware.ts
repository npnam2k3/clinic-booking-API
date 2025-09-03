import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    console.log(
      `[${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}] - ${req.method} - ${req.originalUrl}`,
    );
    next();
  }
}
