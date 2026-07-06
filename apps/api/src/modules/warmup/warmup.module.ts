import { Module } from '@nestjs/common';
import { WarmupService } from './warmup.service';
import { WarmupController } from './warmup.controller';
import { InboxesModule } from '../inboxes/inboxes.module';
import { QueuesModule } from '../queues/queues.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';

@Module({
  imports: [InboxesModule, QueuesModule, WorkspacesModule],
  controllers: [WarmupController],
  providers: [WarmupService],
  exports: [WarmupService],
})
export class WarmupModule {}