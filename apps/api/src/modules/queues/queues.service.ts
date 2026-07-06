
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Queue, JobsOptions } from 'bullmq';
import { ConfigService } from '@nestjs/config';

export enum JobType {
  SEND_EMAIL = 'sendEmail',
  WARMUP_EMAIL = 'warmupEmail',
  FETCH_REPLIES = 'fetchReplies',
  TRACK_OPEN = 'trackOpen',
  SEQUENCE_CAMPAIGN = 'sequenceCampaign',
}

@Injectable()
export class QueuesService implements OnModuleInit {
  private readonly logger = new Logger(QueuesService.name);
  private queues: Map<string, Queue> = new Map();
  private readonly defaultJobOptions: JobsOptions = {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 10000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  };

  constructor(private readonly configService: ConfigService) { }

  onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
    const connection = { url: redisUrl };

    const queueNames = ['email_sending_queue', 'warmup_queue', 'reply_fetch_queue', 'tracking_queue', 'campaign_sequencing_queue'];

    for (const name of queueNames) {
      const queue = new Queue(name, {
        connection,
        defaultJobOptions: this.defaultJobOptions
      });
      this.queues.set(name, queue);
      this.logger.log(`Initialized BullMQ Queue: ${name}`);
    }

    // Schedule Recurring Reply Fetching
    this.addReplyFetchJob({ workspaceId: 'all' });

    // Schedule Recurring Campaign Sequencing
    this.addSequencingJob();
  }

  async addSendingJob(data: any, delayMs: number = 0) {
    const queue = this.queues.get('email_sending_queue');
    return queue.add(JobType.SEND_EMAIL, data, { delay: delayMs });
  }

  async addWarmupJob(data: any, delayMs: number = 0) {
    const queue = this.queues.get('warmup_queue');
    return queue.add(JobType.WARMUP_EMAIL, data, { delay: delayMs });
  }

  async addReplyFetchJob(data: any) {
    const queue = this.queues.get('reply_fetch_queue');
    if (!queue) return;
    return queue.add(JobType.FETCH_REPLIES, data, {
      repeat: { pattern: '*/15 * * * *' } // Every 15 minutes
    });
  }

  async addSequencingJob() {
    const queue = this.queues.get('campaign_sequencing_queue');
    if (!queue) return;
    return queue.add(JobType.SEQUENCE_CAMPAIGN, {}, {
      repeat: { pattern: '*/30 * * * *' } // Every 30 minutes
    });
  }

  async getQueueStatus() {
    const stats = {};
    for (const [name, queue] of this.queues) {
      stats[name] = await queue.getJobCounts();
    }
    return stats;
  }
}
