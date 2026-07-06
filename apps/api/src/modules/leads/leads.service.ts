import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LeadStatus } from '@shared/types';
import { CreateLeadDto, ImportLeadsDto } from './dto/lead.dto';
import { parse } from 'csv-parse';

@Injectable()
export class LeadsService {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * Retrieves leads with optional filtering and search.
   */
  async findAll(workspaceId: string, filters: { status?: string; search?: string }) {
    const where: any = { workspaceId };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.search) {
      where.OR = [
        { email: { contains: filters.search, mode: 'insensitive' } },
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { company: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.lead.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Creates a single lead.
   */
  async create(workspaceId: string, dto: CreateLeadDto) {
    return this.prisma.lead.create({
      data: {
        workspaceId,
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        company: dto.company,
        status: LeadStatus.UNASSIGNED,
        tags: dto.tags || [],
        customFields: dto.customFields || {},
      }
    });
  }

  /**
   * Bulk imports leads with deduplication.
   */
  async importLeads(workspaceId: string, dto: ImportLeadsDto) {
    const leadsToCreate = dto.leads.map(leadData => ({
      workspaceId,
      campaignId: dto.campaignId || null,
      email: leadData.email,
      firstName: leadData.firstName || null,
      lastName: leadData.lastName || null,
      company: leadData.company || null,
      status: LeadStatus.UNASSIGNED,
      tags: dto.tags || [],
      customFields: leadData.customFields || {},
    }));

    const result = await this.prisma.lead.createMany({
      data: (leadsToCreate as any),
      skipDuplicates: true,
    });

    return { success: true, count: result.count };
  }

  /**
   * Parses CSV content and maps it to system fields using a custom mapper.
   */
  async parseCsvWithMapping(csvContent: string, mapping: Record<string, string>): Promise<Partial<CreateLeadDto>[]> {
    return new Promise((resolve, reject) => {
      parse(csvContent, { columns: true, skip_empty_lines: true, trim: true }, (err, records) => {
        if (err) return reject(new BadRequestException('Invalid CSV format'));

        const mapped = records.map((r: any) => {
          const lead: any = { customFields: {} };

          Object.entries(mapping).forEach(([csvHeader, systemField]) => {
            if (['email', 'firstName', 'lastName', 'company'].includes(systemField)) {
              lead[systemField] = r[csvHeader];
            } else {
              lead.customFields[systemField] = r[csvHeader];
            }
          });

          // Basic email fallback
          lead.email = lead.email || r.email || r.Email || r['Email Address'];

          return lead;
        }).filter((r: any) => !!r.email);

        resolve(mapped);
      });
    });
  }

  /**
   * Finds a specific lead by workspace and ID.
   */
  async findOne(workspaceId: string, id: string) {
    const lead = await this.prisma.lead.findFirst({ where: { id, workspaceId } });
    if (!lead) throw new NotFoundException('Lead not found');
    return lead;
  }

  /**
   * Generates a unified chronological timeline of all activities for a lead.
   */
  async getTimeline(workspaceId: string, id: string) {
    await this.findOne(workspaceId, id);

    const [sendingLogs, replyLogs] = await Promise.all([
      this.prisma.sendingLog.findMany({
        where: { leadId: id, workspaceId },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.replyLog.findMany({
        where: { leadId: id, workspaceId },
        orderBy: { receivedAt: 'desc' },
      }),
    ]);

    const events = [
      ...sendingLogs.map((log) => ({
        id: log.id,
        type: 'outbound',
        status: log.status,
        createdAt: (log as any).sentAt || log.createdAt,
        metadata: { campaignId: log.campaignId, stepId: log.stepId },
      })),
      ...replyLogs.map((log) => ({
        id: log.id,
        type: 'inbound',
        status: 'replied',
        createdAt: log.receivedAt,
        metadata: { classification: log.classification, subject: log.subject },
      })),
    ];

    return events.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Updates a lead's status.
   */
  async updateStatus(workspaceId: string, id: string, status: LeadStatus) {
    return this.prisma.lead.update({
      where: { id },
      data: { status, lastEventAt: new Date() }
    });
  }

  /**
   * Bulk updates statuses for multiple leads.
   */
  async bulkUpdateStatus(workspaceId: string, ids: string[], status: LeadStatus) {
    return this.prisma.lead.updateMany({
      where: { id: { in: ids }, workspaceId },
      data: { status, lastEventAt: new Date() }
    });
  }

  /**
   * Removes a single lead.
   */
  async remove(workspaceId: string, id: string) {
    return this.prisma.lead.delete({ where: { id } });
  }

  /**
   * Bulk removes multiple leads.
   */
  async bulkRemove(workspaceId: string, ids: string[]) {
    return this.prisma.lead.deleteMany({
      where: { id: { in: ids }, workspaceId }
    });
  }
}