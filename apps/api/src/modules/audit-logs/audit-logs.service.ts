
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditLogsService {
  private readonly logger = new Logger(AuditLogsService.name);

  constructor(private readonly prisma: PrismaService) { }

  /**
   * Retrieves audit logs with filtering and chronological sorting.
   */
  async findAll(workspaceId: string, filters: { entityType?: string, userId?: string }) {
    const where: any = { workspaceId };

    if (filters.entityType) {
      where.entityType = filters.entityType;
    }

    if (filters.userId) {
      where.userId = filters.userId;
    }

    return this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100, // Safety limit for dashboard
    });
  }

  /**
   * Record a professional audit entry for system actions.
   */
  async log(data: {
    workspaceId: string;
    userId: string;
    userEmail: string;
    action: string;
    entityType: string;
    entityId: string;
    changes?: Record<string, any>;
    ipAddress?: string;
  }) {
    const log = await this.prisma.auditLog.create({
      data: {
        workspaceId: data.workspaceId,
        userId: data.userId,
        userEmail: data.userEmail,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        changes: data.changes || {},
        ipAddress: data.ipAddress,
      }
    });

    this.logger.log(`Audit: ${data.userEmail} executed ${data.action} on ${data.entityType} [${data.entityId}]`);
    return log;
  }
}
