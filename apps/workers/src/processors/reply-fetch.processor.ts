
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { InboxesService } from '@api/modules/inboxes/inboxes.service';
import { RepliesService } from '@api/modules/replies/replies.service';
import { PrismaService } from '@api/modules/prisma/prisma.service';
import { RedisLockService } from '@api/common/locks/redis-lock.service';
import { SmtpAdapter } from '@api/modules/inboxes/adapters/smtp.adapter';
import { QueuesService } from '@api/modules/queues/queues.service';

@Injectable()
export class ReplyFetchProcessor implements OnModuleInit {
  private readonly logger = new Logger(ReplyFetchProcessor.name);
  private worker: Worker;
  private inboxSyncWorker: Worker;

  constructor(
    private readonly configService: ConfigService,
    private readonly inboxesService: InboxesService,
    private readonly repliesService: RepliesService,
    private readonly prisma: PrismaService,
    private readonly lockService: RedisLockService,
    private readonly smtpAdapter: SmtpAdapter,
    private readonly queuesService: QueuesService,
  ) { }

  onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379';

    this.worker = new Worker(
      'reply_fetch_queue',
      async (job: Job) => this.process(job),
      {
        connection: { url: redisUrl },
        concurrency: 1, // Only 1 worker needed to dispatch jobs
      }
    );

    this.inboxSyncWorker = new Worker(
      'inbox_sync_queue',
      async (job: Job) => this.processInboxSync(job),
      {
        connection: { url: redisUrl },
        concurrency: 5, // Sync up to 5 IMAP connections in parallel
      }
    );

    this.logger.log('Hardened Reply Fetch & Parallel Sync Workers: Online');
  }

  async process(job: Job) {
    this.logger.log('Initiating global reply fetch dispatcher cycle...');

    // 1. Fetch all active inboxes that need syncing
    const inboxes = await (this.prisma as any).inbox.findMany({
      where: { status: 'active' },
      select: { id: true, workspaceId: true }
    });

    this.logger.log(`Found ${inboxes.length} active inbox(es) to dispatch for IMAP sync.`);

    for (const inbox of inboxes) {
      await this.queuesService.addInboxSyncJob({
        inboxId: inbox.id,
        workspaceId: inbox.workspaceId,
      });
    }

    return { dispatched: inboxes.length };
  }

  async processInboxSync(job: Job) {
    const { inboxId, workspaceId } = job.data;

    // 2. Prevent concurrent syncs for the same inbox
    const hasLock = await this.lockService.acquireLock(`sync:inbox:${inboxId}`, 300);
    if (!hasLock) {
      this.logger.warn(`Inbox sync lock busy for ${inboxId}. Skipping sync.`);
      return;
    }

    try {
      const inbox = await (this.prisma as any).inbox.findUnique({
        where: { id: inboxId },
        select: { id: true, email: true, lastImapSync: true }
      });

      if (!inbox) {
        this.logger.warn(`Inbox ${inboxId} not found. Sync aborted.`);
        return;
      }

      this.logger.log(`Syncing IMAP for ${inbox.email}...`);

      const creds = await this.inboxesService.getDecryptedCredentials(inboxId);
      const lastSync = inbox.lastImapSync || new Date(Date.now() - 24 * 60 * 60 * 1000);

      // 3. Fetch from adapter
      const rawReplies = await this.smtpAdapter.fetchReplies(creds, lastSync);

      if (rawReplies.length > 0) {
        this.logger.log(`Detected ${rawReplies.length} potential replies for ${inbox.email}`);

        for (const reply of rawReplies) {
          await this.repliesService.processDiscoveredReply(workspaceId, inboxId, reply);
        }
      }

      // 4. Update sync watermark to prevent duplicates
      await (this.prisma as any).inbox.update({
        where: { id: inboxId },
        data: { lastImapSync: new Date() }
      });

      this.logger.log(`Finished syncing IMAP for ${inbox.email}.`);
    } catch (err) {
      this.logger.error(`Failed to sync inbox ${inboxId}: ${err.message}`);
      throw err; // Re-throw to let BullMQ handle attempts/backoff
    } finally {
      await this.lockService.releaseLock(`sync:inbox:${inboxId}`);
    }
  }
}
