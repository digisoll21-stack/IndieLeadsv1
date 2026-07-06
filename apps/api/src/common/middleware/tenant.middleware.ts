
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantContextService } from '../context/tenant-context.service';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
    constructor(private readonly tenantContext: TenantContextService) { }

    use(req: Request, res: Response, next: NextFunction) {
        this.tenantContext.runWithContext({ workspaceId: null, userId: null }, () => {
            next();
        });
    }
}
