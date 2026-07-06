
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) { }

  async getCampaignStats(campaignId: string) {
    const logs = await (this.prisma as any).sendingLog.groupBy({
      by: ['status'],
      where: { campaignId },
      _count: true,
    });

    const replies = await (this.prisma as any).replyLog.count({
      where: { campaignId }
    });

    return {
      sent: logs.find((l: any) => l.status === 'sent')?._count || 0,
      failed: logs.find((l: any) => l.status === 'failed')?._count || 0,
      bounced: logs.find((l: any) => l.status === 'bounced')?._count || 0,
      spamComplaint: logs.find((l: any) => l.status === 'spam_complaint')?._count || 0,
      replies,
    };
  }

  /**
   * 7-day rolling window of sent + replies.
   * Returns daily buckets for the area chart on Dashboard/Analytics.
   */
  async getGlobalPulse(workspaceId: string) {
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    last7Days.setHours(0, 0, 0, 0);

    const [logStats, replyStats] = await Promise.all([
      (this.prisma as any).sendingLog.groupBy({
        by: ['sentAt'],
        where: {
          workspaceId,
          sentAt: { gte: last7Days },
          status: 'sent',
        },
        _count: true,
      }),
      (this.prisma as any).replyLog.groupBy({
        by: ['receivedAt'],
        where: {
          workspaceId,
          receivedAt: { gte: last7Days },
        },
        _count: true,
      }),
    ]);

    const stats = new Map<string, { sent: number; replies: number }>();

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      stats.set(dateStr, { sent: 0, replies: 0 });
    }

    logStats.forEach((s: any) => {
      if (s.sentAt) {
        const dateStr = new Date(s.sentAt).toISOString().split('T')[0];
        if (stats.has(dateStr)) {
          stats.get(dateStr)!.sent += s._count;
        }
      }
    });

    replyStats.forEach((s: any) => {
      const dateStr = new Date(s.receivedAt).toISOString().split('T')[0];
      if (stats.has(dateStr)) {
        stats.get(dateStr)!.replies += s._count;
      }
    });

    return Array.from(stats.entries()).map(([date, data]) => ({
      name: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
      date,
      ...data,
    }));
  }

  /**
   * Aggregate reply sentiment breakdown for the workspace (30d).
   * Used by the Analytics page pie chart.
   */
  async getReplySentiment(workspaceId: string) {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const sentimentGroups = await (this.prisma as any).replyLog.groupBy({
      by: ['classification'],
      where: {
        workspaceId,
        receivedAt: { gte: last30Days },
      },
      _count: true,
    });

    const labelMap: Record<string, string> = {
      interested: 'Interested',
      neutral: 'Neutral',
      not_interested: 'Not Interested',
      unsubscribe: 'Unsubscribe',
      out_of_office: 'Out of Office',
    };

    return sentimentGroups.map((g: any) => ({
      name: labelMap[g.classification] || g.classification || 'Unknown',
      value: g._count,
    }));
  }

  /**
   * Per-campaign performance summary, sorted by sent volume.
   * Used by the Analytics page performance audit table.
   */
  async getCampaignPerformanceTable(workspaceId: string) {
    const campaigns = await this.prisma.campaign.findMany({
      where: { workspaceId },
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true,
        sequences: { select: { id: true, subject: true, order: true }, orderBy: { order: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const results = await Promise.all(
      campaigns.map(async (campaign) => {
        const stats = await this.getCampaignStats(campaign.id);
        const total = stats.sent + stats.failed + stats.bounced;
        const replyRate = total > 0 ? ((stats.replies / total) * 100).toFixed(1) : '0.0';
        const bounceRate = total > 0 ? (((stats.bounced + stats.spamComplaint) / total) * 100).toFixed(1) : '0.0';

        return {
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          steps: campaign.sequences.length,
          ...stats,
          total,
          replyRate: parseFloat(replyRate),
          bounceRate: parseFloat(bounceRate),
        };
      })
    );

    return results;
  }
}
