import { Injectable, Logger } from '@nestjs/common';
import { QueuesService } from '../queues/queues.service';
import { LeadsService } from '../leads/leads.service';
import { CampaignsService } from '../campaigns/campaigns.service';
import { LeadStatus } from '@shared/types';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queuesService: QueuesService,
    private readonly leadsService: LeadsService,
    private readonly campaignsService: CampaignsService,
  ) { }

  async getSendingLog(id: string) {
    return (this.prisma as any).sendingLog.findUnique({ where: { id } });
  }

  async logOpenEvent(logId: string, metadata: { ip: string; userAgent: string }) {
    const log = await (this.prisma as any).sendingLog.findUnique({
      where: { id: logId },
      select: { workspaceId: true, leadId: true, campaignId: true, id: true }
    });

    if (!log) return;

    // ATOMIC MULTI-UPDATE: Create log and increment counter in one transaction
    await (this.prisma as any).$transaction([
      (this.prisma as any).trackingLog.create({
        data: {
          workspaceId: log.workspaceId,
          leadId: log.leadId,
          campaignId: log.campaignId,
          logId: log.id,
          type: 'open',
          ipAddress: metadata.ip,
          userAgent: metadata.userAgent,
        }
      }),
      (this.prisma as any).lead.update({
        where: { id: log.leadId },
        data: { status: LeadStatus.OPENED }
      })
    ]);

    this.logger.debug(`[Scale-Ready] Atomic Open Logged: ${logId}`);
  }

  async logClickEvent(logId: string, metadata: { ip: string; userAgent: string }) {
    const log = await (this.prisma as any).sendingLog.findUnique({
      where: { id: logId },
      select: { workspaceId: true, leadId: true, campaignId: true, id: true }
    });

    if (!log) return;

    await (this.prisma as any).$transaction([
      (this.prisma as any).trackingLog.create({
        data: {
          workspaceId: log.workspaceId,
          leadId: log.leadId,
          campaignId: log.campaignId,
          logId: log.id,
          type: 'click',
          ipAddress: metadata.ip,
          userAgent: metadata.userAgent,
        }
      }),
      (this.prisma as any).lead.update({
        where: { id: log.leadId },
        data: { status: LeadStatus.CLICKED }
      })
    ]);

    this.logger.debug(`[Scale-Ready] Atomic Click Logged: ${logId}`);
  }
}