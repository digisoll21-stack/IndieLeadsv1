
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { RedisLockService } from '@api/common/locks/redis-lock.service';
import { InboxesService } from '@api/modules/inboxes/inboxes.service';
import { PrismaService } from '@api/modules/prisma/prisma.service';
import { SmtpAdapter } from '@api/modules/inboxes/adapters/smtp.adapter';
import { LeadStatus } from '@shared/types';

@Injectable()
export class SendingProcessor implements OnModuleInit {
  private readonly logger = new Logger(SendingProcessor.name);
  private worker: Worker;

  constructor(
    private readonly configService: ConfigService,
    private readonly lockService: RedisLockService,
    private readonly inboxesService: InboxesService,
    private readonly prisma: PrismaService,
    private readonly smtpAdapter: SmtpAdapter,
  ) { }

  onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379';

    this.worker = new Worker(
      'email_sending_queue',
      async (job: Job) => this.process(job),
      {
        connection: { url: redisUrl },
        concurrency: 50,
      }
    );
  }

  async process(job: Job) {
    const { logId, inboxId, leadId, email, trackOpens = true, trackClicks = false } = job.data;

    const hasLock = await this.lockService.acquireLock(inboxId, 30);
    if (!hasLock) throw new Error('Inbox locked by another worker');

    try {
      const inbox = await this.prisma.inbox.findUnique({ where: { id: inboxId } });
      if (!inbox || inbox.status !== 'active') {
        this.logger.warn(`Inbox ${inboxId} is not active. Skipping job ${job.id}`);
        return;
      }

      // CRITICAL: Check if lead is unsubscribed or replied before sending
      const lead = await this.prisma.lead.findUnique({
        where: { id: leadId },
        include: { campaign: true }
      });

      const isUnsubscribed = lead?.status === LeadStatus.UNSUBSCRIBED;
      const isReplied = lead?.status === LeadStatus.REPLIED;
      const settings = (lead?.campaign?.settings as any) || {};
      const stopOnReply = settings.stopOnReply ?? true;

      if (!lead || isUnsubscribed || (isReplied && stopOnReply)) {
        this.logger.warn(`Lead ${leadId} skipped (Status: ${lead?.status}, StopOnReply: ${stopOnReply})`);
        await this.prisma.sendingLog.update({
          where: { id: logId },
          data: {
            status: 'skipped',
            errorMessage: isUnsubscribed ? 'Lead unsubscribed' : 'Lead already replied'
          }
        });
        return;
      }

      const creds = await this.inboxesService.getDecryptedCredentials(inboxId);

      // 1. Append inbox signature to email body
      const signature = (inbox as any).signature;
      let bodyWithSignature = signature
        ? `${email.body}<br/><br/>--<br/>${signature}`
        : email.body;

      // 2. Automated Tracking & Unsubscribe Injection
      const apiUrl = this.configService.get<string>('API_URL') || 'https://api.indieleads.ai';
      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'https://app.indieleads.ai';

      let finalBody = bodyWithSignature;

      // Inject Open Tracking Pixel
      if (trackOpens) {
        const pixelUrl = `${apiUrl}/t/o/${logId}`;
        finalBody += `<img src="${pixelUrl}" width="1" height="1" style="display:none" alt="" />`;
      }

      // Inject Click Tracking (Rewrite Links)
      if (trackClicks) {
        const linkRegex = /<a\s+(?:[^>]*?\s+)?href="([^"]*)"/gi;
        finalBody = finalBody.replace(linkRegex, (match, url) => {
          if (url.startsWith('mailto:') || url.startsWith('#') || url.includes('/unsub/')) return match;
          const encodedUrl = Buffer.from(url).toString('base64url');
          const trackingUrl = `${apiUrl}/t/c/${logId}?r=${encodedUrl}`;
          return match.replace(url, trackingUrl);
        });
      }

      // Inject Unsubscribe Link (if not already present)
      if (!finalBody.includes('/unsub/')) {
        const unsubUrl = `${frontendUrl}/#/unsub/${leadId}`;
        const settings = (lead?.campaign?.settings as any) || {};
        const unsubText = settings.unsubscribeText || 'Unsubscribe';
        finalBody += `<br/><br/><div style="font-size: 11px; color: #94a3b8; text-align: center;"><a href="${unsubUrl}" style="color: #94a3b8; text-decoration: underline;">${unsubText}</a></div>`;
      }

      // Execute Sending — inject X-IndieLeads-Log-Id for reply correlation
      await this.smtpAdapter.sendEmail(creds, {
        to: email.to,
        fromName: inbox.fromName || 'IndieLeads',
        subject: email.subject,
        body: finalBody,
        logId,           // Written into X-IndieLeads-Log-Id header for IMAP reply matching
        leadId,
      });

      // Update Database
      await this.prisma.sendingLog.update({
        where: { id: logId },
        data: {
          status: 'sent',
          sentAt: new Date(),
        }
      });

      await this.prisma.lead.update({
        where: { id: leadId },
        data: { status: LeadStatus.SENT }
      });

      this.logger.log(`[Job ${job.id}] Successfully sent email to ${email.to}`);

    } catch (err) {
      this.logger.error(`[Job ${job.id}] Failed: ${err.message}`);

      await this.prisma.sendingLog.update({
        where: { id: logId },
        data: {
          status: 'failed',
          errorMessage: err.message
        }
      });

      throw err; // Re-queue if transient
    } finally {
      await this.lockService.releaseLock(inboxId);
    }
  }
}
