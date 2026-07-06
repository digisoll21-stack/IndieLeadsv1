
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { InboxesService } from '@api/modules/inboxes/inboxes.service';
import { RepliesService } from '@api/modules/replies/replies.service';
import { PrismaService } from '@api/modules/prisma/prisma.service';
import { RedisLockService } from '@api/common/locks/redis-lock.service';
import { SmtpAdapter } from '@api/modules/inboxes/adapters/smtp.adapter';

@Injectable()
export class ReplyFetchProcessor implements OnModuleInit {
  private readonly logger = new Logger(ReplyFetchProcessor.name);
  private worker: Worker;

  constructor(
    private readonly configService: ConfigService,
    private readonly inboxesService: InboxesService,
    private readonly repliesService: RepliesService,
    private readonly prisma: PrismaService,
    private readonly lockService: RedisLockService,
    private readonly smtpAdapter: SmtpAdapter,
  ) { }

  onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379';

    this.worker = new Worker(
      'reply_fetch_queue',
      async (job: Job) => this.process(job),
      {
        connection: { url: redisUrl },
        concurrency: 2, // Low concurrency for IMAP to prevent ISP banning
      }
    );
    this.logger.log('Hardened Reply Fetch Worker: Online');
  }

  async process(job: Job) {
    this.logger.log('Initiating global reply fetch cycle across all active nodes...');

    // 1. Fetch all active inboxes that need syncing
    const inboxes = await (this.prisma as any).inbox.findMany({
      where: { status: 'active' },
      select: { id: true, email: true, workspaceId: true, lastImapSync: true }
    });

    for (const inbox of inboxes) {
      // 2. Prevent concurrent syncs for the same inbox
      const hasLock = await this.lockService.acquireLock(`sync:inbox:${inbox.id}`, 300);
      if (!hasLock) continue;

      try {
        const creds = await this.inboxesService.getDecryptedCredentials(inbox.id);
        const lastSync = inbox.lastImapSync || new Date(Date.now() - 24 * 60 * 60 * 1000);

        // 3. Fetch from adapter
        const rawReplies = await this.smtpAdapter.fetchReplies(creds, lastSync);

        if (rawReplies.length > 0) {
          this.logger.log(`Detected ${rawReplies.length} potential replies for ${inbox.email}`);

          for (const reply of rawReplies) {
            await this.repliesService.processDiscoveredReply(inbox.workspaceId, inbox.id, reply);
          }
        }

        // 4. Update sync watermark to prevent duplicates
        await (this.prisma as any).inbox.update({
          where: { id: inbox.id },
          data: { lastImapSync: new Date() }
        });

      } catch (err) {
        this.logger.error(`Failed to sync inbox ${inbox.email}: ${err.message}`);
      } finally {
        await this.lockService.releaseLock(`sync:inbox:${inbox.id}`);
      }
    }

    return { synced: inboxes.length };
  }
}
