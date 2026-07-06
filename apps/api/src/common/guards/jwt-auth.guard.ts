import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { Buffer } from 'buffer';
import { TenantContextService } from '../context/tenant-context.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly tenantContext: TenantContextService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    const workspaceHeader = request.headers['x-workspace-id'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No protocol token provided');
    }

    const token = authHeader.split(' ')[1];
    const secret = this.configService.get('JWT_SECRET');

    try {
      const [header, payload, signature] = token.split('.');
      
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${header}.${payload}`)
        .digest('base64url');

      if (signature !== expectedSignature) {
        throw new UnauthorizedException('Protocol breach: Invalid signature');
      }

      const decodedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString());
      
      if (decodedPayload.exp < Math.floor(Date.now() / 1000)) {
        throw new UnauthorizedException('Token expired: Session terminated');
      }

      // Populate Tenant Context
      const activeWorkspaceId = workspaceHeader || decodedPayload.workspaceId;
      this.tenantContext.setUserId(decodedPayload.sub);
      this.tenantContext.setWorkspaceId(activeWorkspaceId);

      request.user = { id: decodedPayload.sub, workspaceId: activeWorkspaceId };
      return true;
    } catch (err) {
      throw new UnauthorizedException('Authentication failed: Terminal restricted');
    }
  }
}