
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CampaignStatus, CampaignSettings } from '@shared/types';
import { PlanEnforcementService } from '../workspaces/plan-enforcement.service';
import { AbuseFilterService } from '../common/abuse-filter.service';
import { CreateCampaignDto, UpdateCampaignDto } from './dto/campaign.dto';

@Injectable()
export class CampaignsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly planEnforcement: PlanEnforcementService,
    private readonly abuseFilter: AbuseFilterService,
  ) { }

  async create(workspaceId: string, dto: CreateCampaignDto) {
    // Plan Enforcement: Check if workspace has reached its campaign limit
    await this.planEnforcement.checkCampaignLimit(workspaceId);
    return this.prisma.campaign.create({
      data: {
        workspaceId,
        name: dto.name,
        status: CampaignStatus.DRAFT,
        settings: {
          stopOnReply: true,
          trackOpens: true,
          trackClicks: false,
          dailyLimit: 200,
          inboxIds: [],
          workDaysOnly: true,
          startTime: "09:00",
          endTime: "17:00",
          timezone: "UTC",
          minDelaySeconds: 60,
          maxDelaySeconds: 300,
          autoPauseOnBounceRate: 5,
          autoPauseOnSpamComplaint: true,
        },
      },
    });
  }

  async findAll(workspaceId: string, page: number = 1, limit: number = 10, search?: string, status?: string) {
    const skip = (page - 1) * limit;
    const where: any = { workspaceId };

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    const [data, total] = await Promise.all([
      this.prisma.campaign.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { leads: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.campaign.count({ where })
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async findOne(workspaceId: string, id: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id, workspaceId },
      include: { sequences: { orderBy: { order: 'asc' } } }
    });

    if (!campaign) throw new NotFoundException('Campaign not found');
    return campaign;
  }

  async update(workspaceId: string, id: string, dto: UpdateCampaignDto) {
    return this.prisma.campaign.update({
      where: { id },
      data: { ...dto, updatedAt: new Date() }
    });
  }

  async updateSequence(workspaceId: string, id: string, steps: any[]) {
    // Abuse Filter: Check steps for spam content
    this.abuseFilter.validateSequence(steps);

    // Transactional update: delete old steps and create new ones
    return this.prisma.$transaction(async (tx) => {
      await tx.sequenceStep.deleteMany({ where: { campaignId: id } });

      const createdSteps = await Promise.all(
        steps.map((step, idx) =>
          tx.sequenceStep.create({
            data: {
              campaignId: id,
              order: idx + 1,
              subject: step.subject,
              body: step.body,
              delayDays: step.delayDays || 0,
              waitMinutes: step.waitMinutes || 0,
              specificStartTime: step.specificStartTime || null,
            }
          })
        )
      );
      return createdSteps;
    });
  }

  async remove(workspaceId: string, id: string) {
    return this.prisma.campaign.delete({
      where: { id }
    });
  }
}
