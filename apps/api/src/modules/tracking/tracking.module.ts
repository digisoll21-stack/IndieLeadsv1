
import { Module } from '@nestjs/common';
import { TrackingController } from './tracking.controller';
import { TrackingService } from './tracking.service';
import { QueuesModule } from '../queues/queues.module';
import { LeadsModule } from '../leads/leads.module';
import { CampaignsModule } from '../campaigns/campaigns.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, QueuesModule, LeadsModule, CampaignsModule],
  controllers: [TrackingController],
  providers: [TrackingService],
  exports: [TrackingService],
})
export class TrackingModule { }
