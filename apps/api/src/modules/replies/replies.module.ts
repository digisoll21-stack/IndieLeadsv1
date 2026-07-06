import { Module } from '@nestjs/common';
import { RepliesService } from './replies.service';
import { RepliesController } from './replies.controller';
import { LeadsModule } from '../leads/leads.module';
import { InboxesModule } from '../inboxes/inboxes.module';
import { CampaignsModule } from '../campaigns/campaigns.module';
import { TrackingModule } from '../tracking/tracking.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';

@Module({
  imports: [LeadsModule, InboxesModule, CampaignsModule, TrackingModule, WorkspacesModule],
  controllers: [RepliesController],
  providers: [RepliesService],
  exports: [RepliesService],
})
export class RepliesModule {}