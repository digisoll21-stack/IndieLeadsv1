import { Module } from '@nestjs/common';
import { DeliverabilityLabService } from './deliverability-lab.service';
import { DeliverabilityLabController } from './deliverability-lab.controller';
import { InboxesModule } from '../inboxes/inboxes.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';

@Module({
  imports: [InboxesModule, WorkspacesModule],
  controllers: [DeliverabilityLabController],
  providers: [DeliverabilityLabService],
  exports: [DeliverabilityLabService],
})
export class DeliverabilityLabModule {}