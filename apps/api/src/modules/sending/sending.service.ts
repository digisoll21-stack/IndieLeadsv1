
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueuesService } from '../queues/queues.service';
import { InboxSchedulerService } from './scheduler.service';
import { MxService } from '../leads/mx.service';
import { v4 as uuidv4 } from 'uuid';
import { Buffer } from 'buffer';

@Injectable()
export class SendingService {
  private readonly logger = new Logger(SendingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queuesService: QueuesService,
    private readonly scheduler: InboxSchedulerService,
    private readonly mxService: MxService,
  ) { }

  async processCampaignBatch(campaign: any) {
    const { id: campaignId, workspaceId, settings, sequences } = campaign;
    if (!sequences || sequences.length === 0) return;

    const leads = await (this.prisma as any).lead.findMany({
      where: {
        workspaceId,
        currentCampaignId: campaignId,
        status: { notIn: ['replied', 'bounced', 'unsubscribed'] }
      },
      take: 20
    });

    for (const lead of leads) {
      // 1. PRE-FLIGHT MX CHECK
      const hasMx = await this.mxService.verifyMx(lead.email);
      if (!hasMx) {
        await (this.prisma as any).lead.update({
          where: { id: lead.id },
          data: { status: 'bounced' }
        });
        continue;
      }

      const currentStep = lead.currentStepOrder || 0;
      const nextStep = sequences.find((s: any) => s.order === currentStep + 1);
      if (!nextStep) continue;

      if (lead.lastEventAt) {
        const msElapsed = Date.now() - new Date(lead.lastEventAt).getTime();
        if (msElapsed < (nextStep.delayDays * 24 * 60 * 60 * 1000)) continue;
      }

      const inbox = await this.findAvailableInbox(workspaceId, settings.inboxIds);
      if (!inbox) break;

      await this.enqueueEmail(inbox, campaign, lead, nextStep);
    }
  }

  private async findAvailableInbox(workspaceId: string, inboxIds: string[]) {
    for (const id of inboxIds) {
      const inbox = await (this.prisma as any).inbox.findUnique({ where: { id } });
      if (!inbox || inbox.status !== 'active') continue;

      const isAvailable = await this.scheduler.checkInboxAvailability(id, {
        dailyLimit: inbox.dailyLimit,
        hourlyLimit: inbox.hourlyLimit
      });

      if (isAvailable) return inbox;
    }
    return null;
  }

  private async enqueueEmail(inbox: any, campaign: any, lead: any, step: any) {
    const logId = uuidv4();
    const variables = {
      firstName: lead.firstName || 'there',
      company: lead.company || 'your company',
      ... (lead.customFields as any)
    };

    let body = this.personalize(step.body, variables);
    const subject = this.personalize(step.subject, variables);

    if (campaign.settings.trackOpens) {
      const pixelUrl = `${process.env.API_URL || 'https://api.indieleads.ai'}/api/v1/t/o/${logId}`;
      body += `<img src="${pixelUrl}" width="1" height="1" style="display:none !important;" />`;
    }

    if (campaign.settings.trackClicks) {
      body = this.rewriteLinks(body, logId);
    }

    body += `<br/><br/><div style="font-size:10px;color:#94a3b8;">No longer want to hear from us? <a href="${process.env.FRONTEND_URL}/#/unsub/${lead.id}">Unsubscribe here</a>.</div>`;

    const delayMs = await this.scheduler.calculateNextSendDelay(inbox.id, {
      dailyLimit: inbox.dailyLimit,
      hourlyLimit: inbox.hourlyLimit,
      minDelay: campaign.settings.minDelaySeconds || 60,
      maxDelay: campaign.settings.maxDelaySeconds || 300,
      workDaysOnly: campaign.settings.workDaysOnly,
      timeWindow: { start: campaign.settings.startTime, end: campaign.settings.endTime }
    });

    await this.queuesService.addSendingJob({
      logId,
      inboxId: inbox.id,
      campaignId: campaign.id,
      leadId: lead.id,
      stepId: step.id,
      email: { to: lead.email, subject, body }
    }, delayMs);

    await (this.prisma as any).sendingLog.create({
      data: {
        id: logId,
        workspaceId: lead.workspaceId,
        campaignId: campaign.id,
        inboxId: inbox.id,
        leadId: lead.id,
        stepId: step.id,
        status: 'queued'
      }
    });
  }

  private rewriteLinks(html: string, logId: string): string {
    const trackingBase = process.env.API_URL || 'https://api.indieleads.ai/api/v1/t';
    return html.replace(/<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1/gi, (match, quote, url) => {
      if (url.startsWith('mailto:') || url.includes('unsub')) return match;
      const encodedUrl = Buffer.from(url).toString('base64url');
      const trackedUrl = `${trackingBase}/c/${logId}?r=${encodedUrl}`;
      return match.replace(url, trackedUrl);
    });
  }

  private personalize(text: string, vars: Record<string, string>): string {
    let res = text.replace(/\{([^{}]*)\}/g, (_, choice) => {
      const options = choice.split('|');
      return options[Math.floor(Math.random() * options.length)];
    });
    Object.entries(vars).forEach(([k, v]) => {
      res = res.replace(new RegExp(`\\{\\{\\s*${k}\\s*\\}\\}`, 'gi'), v || '');
    });
    return res;
  }
}
