
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LeadsService } from '../leads/leads.service';
import { CampaignsService } from '../campaigns/campaigns.service';
import { InboxesService } from '../inboxes/inboxes.service';
import { NotificationsService } from '../notifications/notifications.service';
import { LeadStatus, CampaignStatus, NotificationType, Severity } from '@shared/types';

export interface BounceEvent {
  logId: string;
  type: 'hard' | 'soft' | 'spam';
  rawReason: string;
}

@Injectable()
export class BouncesService {
  private readonly logger = new Logger(BouncesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly leadsService: LeadsService,
    private readonly campaignsService: CampaignsService,
    private readonly inboxesService: InboxesService,
    private readonly notificationsService: NotificationsService,
  ) { }

  /**
   * Main entry point — fully DB-backed.
   * Persists bounce event, updates lead status, SendingLog status,
   * and evaluates auto-pause thresholds from real data.
   */
  async processBounceEvent(event: BounceEvent) {
    this.logger.warn(`Processing ${event.type} bounce for log: ${event.logId}`);

    // 1. Find sending log context
    const log = await this.prisma.sendingLog.findUnique({
      where: { id: event.logId },
    });

    if (!log) {
      this.logger.error(`No sending log found for ID: ${event.logId}`);
      return;
    }

    const { leadId, campaignId, workspaceId, inboxId } = log;

    // 2. Persist the bounce to the DB (replaces in-memory Map)
    await this.prisma.bounceLog.create({
      data: {
        workspaceId,
        campaignId,
        inboxId,
        leadId,
        sendingLogId: event.logId,
        type: event.type,
        rawReason: event.rawReason || null,
      },
    });

    // 3. Update the SendingLog status to reflect the bounce
    const newLogStatus = event.type === 'spam' ? 'spam_complaint' : 'bounced';
    await this.prisma.sendingLog.update({
      where: { id: event.logId },
      data: { status: newLogStatus },
    });

    // 4. Classify and update Lead
    if (event.type === 'hard') {
      await this.leadsService.updateStatus(workspaceId, leadId, LeadStatus.BOUNCED);
    } else if (event.type === 'spam') {
      await this.leadsService.updateStatus(workspaceId, leadId, LeadStatus.SPAM_COMPLAINT);

      // Spam complaint → immediately alert and pause inbox
      await this.notificationsService.createAlert({
        workspaceId,
        type: NotificationType.SPAM_COMPLAINT,
        severity: Severity.CRITICAL,
        title: 'Spam Complaint Detected',
        message: `Lead ${leadId} marked an email from inbox ${inboxId} as spam. Inbox has been paused for safety.`,
        metadata: { leadId, inboxId, campaignId },
      });

      await this.protectInbox(workspaceId, inboxId, 'Spam complaint received');
    }

    // 5. Re-evaluate bounce rate from real DB data
    await this.evaluateBounceThreshold(workspaceId, campaignId);
  }

  /**
   * Computes real bounce rate from DB records (not in-memory).
   * Uses a rolling window of the last 100 sends for the campaign.
   * Auto-pauses campaign if rate exceeds configured threshold.
   */
  private async evaluateBounceThreshold(workspaceId: string, campaignId: string) {
    // Count of total sent emails for this campaign (rolling last 100)
    const recentLogs = await this.prisma.sendingLog.findMany({
      where: { campaignId, status: { not: 'pending' } },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: { status: true },
    });

    if (recentLogs.length < 10) {
      // Not enough samples to make a decision
      return;
    }

    const hardBounces = recentLogs.filter((l: any) => l.status === 'bounced').length;
    const spamComplaints = recentLogs.filter((l: any) => l.status === 'spam_complaint').length;
    const totalProblems = hardBounces + spamComplaints;
    const bounceRate = (totalProblems / recentLogs.length) * 100;

    this.logger.debug(
      `Bounce check for campaign ${campaignId}: ${bounceRate.toFixed(1)}% ` +
      `(${totalProblems}/${recentLogs.length} sends)`
    );

    // Get campaign settings for the configured threshold
    const campaign = await this.campaignsService.findOne(workspaceId, campaignId);
    const bounceThreshold = (campaign.settings as any)?.autoPauseOnBounceRate ?? 5;

    if (bounceRate >= bounceThreshold) {
      this.logger.error(
        `Campaign ${campaignId} bounce rate: ${bounceRate.toFixed(1)}% ` +
        `≥ threshold ${bounceThreshold}%. Auto-pausing.`
      );

      // Only pause if currently active (prevent duplicate alerts)
      if (campaign.status === 'active') {
        await this.campaignsService.update(workspaceId, campaignId, {
          status: CampaignStatus.PAUSED,
        });

        await this.notificationsService.createAlert({
          workspaceId,
          type: NotificationType.BOUNCE_SPIKE,
          severity: Severity.CRITICAL,
          title: 'Campaign Auto-Paused: High Bounce Rate',
          message:
            `Campaign "${campaign.name}" paused — bounce rate hit ` +
            `${bounceRate.toFixed(1)}%, exceeding your threshold of ${bounceThreshold}%.`,
          metadata: { campaignId, bounceRate, threshold: bounceThreshold },
        });
      }
    }
  }

  /**
   * Pauses the inbox and creates an alert.
   */
  private async protectInbox(workspaceId: string, inboxId: string, reason: string) {
    this.logger.error(`Auto-protecting inbox ${inboxId}: ${reason}`);
    await this.inboxesService.updateSettings(workspaceId, inboxId, { status: 'paused' } as any);

    await this.notificationsService.createAlert({
      workspaceId,
      type: NotificationType.INBOX_DISCONNECTED,
      severity: Severity.WARNING,
      title: 'Inbox Paused Automatically',
      message: `Inbox ${inboxId} was paused: ${reason}. Please review before resuming.`,
    });
  }

  /**
   * Returns bounce history for a workspace (for the analytics/bounces UI).
   */
  async getBounceHistory(workspaceId: string, limit = 50) {
    return this.prisma.bounceLog.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Returns aggregate bounce stats for a workspace.
   * Used by the Analytics page.
   */
  async getBounceStats(workspaceId: string) {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const [hard, soft, spam, totalSent] = await Promise.all([
      this.prisma.bounceLog.count({
        where: { workspaceId, type: 'hard', createdAt: { gte: last30Days } },
      }),
      this.prisma.bounceLog.count({
        where: { workspaceId, type: 'soft', createdAt: { gte: last30Days } },
      }),
      this.prisma.bounceLog.count({
        where: { workspaceId, type: 'spam', createdAt: { gte: last30Days } },
      }),
      this.prisma.sendingLog.count({
        where: {
          workspaceId,
          status: { not: 'pending' },
          sentAt: { gte: last30Days },
        },
      }),
    ]);

    const total = hard + soft + spam;
    const bounceRate = totalSent > 0 ? ((total / totalSent) * 100).toFixed(2) : '0.00';

    return {
      hard,
      soft,
      spam,
      total,
      bounceRate: parseFloat(bounceRate),
      totalSent,
      period: '30d',
    };
  }
}
