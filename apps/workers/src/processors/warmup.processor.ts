
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { RedisLockService } from '@api/common/locks/redis-lock.service';
import { InboxesService } from '@api/modules/inboxes/inboxes.service';
import { PrismaService } from '@api/modules/prisma/prisma.service';
import { SmtpAdapter } from '@api/modules/inboxes/adapters/smtp.adapter';
import { QueuesService } from '@api/modules/queues/queues.service';

@Injectable()
export class WarmupProcessor implements OnModuleInit {
  private readonly logger = new Logger(WarmupProcessor.name);
  private worker: Worker;

  constructor(
    private readonly configService: ConfigService,
    private readonly lockService: RedisLockService,
    private readonly inboxesService: InboxesService,
    private readonly prisma: PrismaService,
    private readonly smtpAdapter: SmtpAdapter,
    private readonly queuesService: QueuesService,
  ) { }

  onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379';

    this.worker = new Worker(
      'warmup_queue',
      async (job: Job) => this.process(job),
      {
        connection: { url: redisUrl },
        concurrency: 10,
      }
    );

    this.logger.log('Warmup Worker: Online — Real SMTP dispatch active.');
  }

  async process(job: Job) {
    const { senderId, recipientId, subject, body, isInitial } = job.data;

    const hasLock = await this.lockService.acquireLock(`warmup:${senderId}`, 60);
    if (!hasLock) {
      this.logger.warn(`Warmup lock busy for inbox ${senderId}, skipping.`);
      return;
    }

    try {
      this.logger.log(`Executing Warmup Job: ${senderId} -> ${recipientId} (isInitial: ${isInitial})`);

      // 1. Fetch the two inboxes involved
      const [senderInbox, recipientInbox] = await Promise.all([
        this.prisma.inbox.findUnique({ where: { id: senderId } }),
        this.prisma.inbox.findUnique({ where: { id: recipientId } }),
      ]);

      if (!senderInbox || !recipientInbox) {
        this.logger.warn(`Warmup: One or both inboxes not found. Skipping.`);
        return;
      }

      // 2. Get decrypted credentials for the sender
      const creds = await this.inboxesService.getDecryptedCredentials(senderId);

      // 3. REAL SMTP send via the production adapter
      await this.smtpAdapter.sendEmail(creds, {
        to: recipientInbox.email,
        fromName: senderInbox.fromName || 'IndieLeads Warmup',
        subject,
        body: `<p>${body}</p>`,
        logId: `warmup_${job.id}`,
        leadId: `warmup`,
      });

      this.logger.log(`✅ Warmup email sent: ${senderInbox.email} -> ${recipientInbox.email}`);

      // 4. Update daily count and total count atomically
      const today = new Date().toISOString().split('T')[0];
      const senderAccount = await (this.prisma as any).warmupAccount.findUnique({
        where: { inboxId: senderId },
      });

      if (senderAccount) {
        const lastSentDay = senderAccount.lastSentDate
          ? new Date(senderAccount.lastSentDate).toISOString().split('T')[0]
          : null;

        const todayCount = lastSentDay === today ? senderAccount.todaySent + 1 : 1;

        await (this.prisma as any).warmupAccount.update({
          where: { inboxId: senderId },
          data: {
            totalSent: { increment: 1 },
            todaySent: todayCount,
            lastSentDate: new Date(),
          },
        });
      }

      // 5. If this was the initial email, simulate a human reply 70% of the time
      // Schedule a delayed reply job back through the queue (sender becomes recipient, and vice-versa)
      if (isInitial && Math.random() > 0.3) {
        this.logger.debug(`Scheduling warmup reply: ${recipientInbox.email} -> ${senderInbox.email}`);

        // Delay by 2-20 minutes to simulate reading time
        const replyDelayMs = (Math.floor(Math.random() * 18) + 2) * 60 * 1000;

        await this.queuesService.addWarmupJob(
          {
            senderId: recipientId,   // The recipient now replies
            recipientId: senderId,   // Back to the original sender
            subject: `Re: ${subject}`,
            body: `Thanks for reaching out! That's a great point about "${subject}". Happy to connect.`,
            isInitial: false,         // This is a reply, not an initial email
          },
          replyDelayMs,
        );

        // Increment totalReceived for the original sender (they'll receive this reply)
        if (senderAccount) {
          await (this.prisma as any).warmupAccount.update({
            where: { inboxId: senderId },
            data: { totalReceived: { increment: 1 } },
          });
        }
      }

    } catch (err) {
      this.logger.error(`Warmup job failed for ${senderId}: ${err.message}`);
      // Do NOT re-throw — warmup failures are non-critical
    } finally {
      await this.lockService.releaseLock(`warmup:${senderId}`);
    }
  }
}
