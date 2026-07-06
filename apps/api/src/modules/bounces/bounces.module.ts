
import { Module } from '@nestjs/common';
import { BouncesService } from './bounces.service';
import { BouncesController } from './bounces.controller';
import { LeadsModule } from '../leads/leads.module';
import { CampaignsModule } from '../campaigns/campaigns.module';
import { InboxesModule } from '../inboxes/inboxes.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../prisma/prisma.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';

@Module({
  imports: [PrismaModule, WorkspacesModule, LeadsModule, CampaignsModule, InboxesModule, NotificationsModule],
  controllers: [BouncesController],
  providers: [BouncesService],
  exports: [BouncesService],
})
export class BouncesModule { }
