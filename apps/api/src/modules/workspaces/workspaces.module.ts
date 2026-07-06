
import { Module } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { WorkspacesController } from './workspaces.controller';
import { SubscriptionService } from './subscription.service';
import { PlanEnforcementService } from './plan-enforcement.service';
import { InvitesController } from './invites.controller';
import { BillingController } from './billing.controller';

import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [WorkspacesController, InvitesController, BillingController],
  providers: [WorkspacesService, SubscriptionService, PlanEnforcementService],
  exports: [WorkspacesService, SubscriptionService, PlanEnforcementService],
})
export class WorkspacesModule { }
