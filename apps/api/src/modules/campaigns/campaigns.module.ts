
import { Module } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { CampaignsController } from './campaigns.controller';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { SequencerService } from './sequencer.service';
import { QueuesModule } from '../queues/queues.module';
import { AbuseFilterService } from '../common/abuse-filter.service';

@Module({
  imports: [WorkspacesModule, QueuesModule],
  controllers: [CampaignsController],
  providers: [CampaignsService, SequencerService, AbuseFilterService],
  exports: [CampaignsService, SequencerService],
})
export class CampaignsModule { }
