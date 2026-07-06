import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export enum PlanTier {
    LAUNCH = 'launch',
    GROW = 'grow',
    PRO = 'pro',
}

export const PLAN_LIMITS = {
    [PlanTier.LAUNCH]: {
        maxInboxes: 3,
        maxCampaigns: 2,
        maxLeadsPerCampaign: 2000,
    },
    [PlanTier.GROW]: {
        maxInboxes: 25,
        maxCampaigns: 15,
        maxLeadsPerCampaign: 15000,
    },
    [PlanTier.PRO]: {
        maxInboxes: 100,
        maxCampaigns: 100,
        maxLeadsPerCampaign: 100000,
    },
};

@Injectable()
export class PlanEnforcementService {
    constructor(private readonly prisma: PrismaService) { }

    async checkInboxLimit(workspaceId: string) {
        const workspace = await (this.prisma as any).workspace.findUnique({
            where: { id: workspaceId },
            select: { plan: true },
        });

        const plan = (workspace?.plan as PlanTier) || PlanTier.LAUNCH;
        const limits = PLAN_LIMITS[plan];

        const count = await this.prisma.inbox.count({
            where: { workspaceId },
        });

        if (count >= limits.maxInboxes) {
            throw new ForbiddenException(`Your ${plan} plan is limited to ${limits.maxInboxes} inboxes. Please upgrade for more.`);
        }
    }

    async checkCampaignLimit(workspaceId: string) {
        const workspace = await (this.prisma as any).workspace.findUnique({
            where: { id: workspaceId },
            select: { plan: true },
        });

        const plan = (workspace?.plan as PlanTier) || PlanTier.LAUNCH;
        const limits = PLAN_LIMITS[plan];

        const count = await this.prisma.campaign.count({
            where: { workspaceId },
        });

        if (count >= limits.maxCampaigns) {
            throw new ForbiddenException(`Your ${plan} plan is limited to ${limits.maxCampaigns} campaigns. Please upgrade for more.`);
        }
    }

    async checkLeadLimit(workspaceId: string, campaignId: string, newLeadsCount: number) {
        const workspace = await (this.prisma as any).workspace.findUnique({
            where: { id: workspaceId },
            select: { plan: true },
        });

        const plan = (workspace?.plan as PlanTier) || PlanTier.LAUNCH;
        const limits = PLAN_LIMITS[plan];

        const currentCount = await this.prisma.lead.count({
            where: { campaignId },
        });

        if (currentCount + newLeadsCount > limits.maxLeadsPerCampaign) {
            throw new ForbiddenException(`Your ${plan} plan is limited to ${limits.maxLeadsPerCampaign} leads per campaign.`);
        }
    }
}
