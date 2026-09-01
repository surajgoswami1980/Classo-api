import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const user = req['user'] as any;

    if (user && user.school_id) {
      req['school_id'] = user.school_id;
    } else if (req.headers['x-school-id']) {
      req['school_id'] = parseInt(req.headers['x-school-id'] as string, 10);
    }

    next();
  }
}
