import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SendingProcessor } from './processors/sending.processor';
import { WarmupProcessor } from './processors/warmup.processor';
import { SequencerProcessor } from './processors/sequencer.processor';
import { ReplyFetchProcessor } from './processors/reply-fetch.processor';
import { InboxesModule } from '@api/modules/inboxes/inboxes.module';
import { CampaignsModule } from '@api/modules/campaigns/campaigns.module';
import { RedisLockService } from '@api/common/locks/redis-lock.service';
import { SmtpAdapter } from '@api/modules/inboxes/adapters/smtp.adapter';
import { PrismaModule } from '@api/modules/prisma/prisma.module';
import { RepliesModule } from '@api/modules/replies/replies.module';
import { QueuesModule } from '@api/modules/queues/queues.module';
import { QueuesService } from '@api/modules/queues/queues.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    PrismaModule,
    InboxesModule,
    CampaignsModule,
    RepliesModule,
    QueuesModule,
  ],
  providers: [
    SendingProcessor,
    WarmupProcessor,
    SequencerProcessor,
    ReplyFetchProcessor,
    RedisLockService,
    SmtpAdapter,
    QueuesService,
  ],
})
export class WorkerModule { }
