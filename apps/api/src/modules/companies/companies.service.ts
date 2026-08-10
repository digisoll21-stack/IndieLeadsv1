import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SmtpAdapter } from '../inboxes/adapters/smtp.adapter';
import { CreateCompanyDto, UpdateCompanyStageDto, CreateStakeholderDto, AddCompanyNoteDto, SendDirectEmailDto } from './dto/company.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CompaniesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly smtpAdapter: SmtpAdapter,
  ) {}

  async createCompany(workspaceId: string, dto: CreateCompanyDto) {
    return (this.prisma as any).company.create({
      data: {
        workspaceId,
        name: dto.name,
        domain: dto.domain,
        website: dto.website,
        industry: dto.industry,
        employeeCount: dto.employeeCount,
        dealStage: dto.dealStage || 'prospect',
        dealValue: dto.dealValue || 0,
      },
      include: {
        stakeholders: true,
        notes: true,
      },
    });
  }

  async findAll(workspaceId: string, options?: { dealStage?: string; search?: string }) {
    const where: any = { workspaceId };
    if (options?.dealStage) {
      where.dealStage = options.dealStage;
    }
    if (options?.search) {
      where.OR = [
        { name: { contains: options.search, mode: 'insensitive' } },
        { domain: { contains: options.search, mode: 'insensitive' } },
        { industry: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    return (this.prisma as any).company.findMany({
      where,
      include: {
        stakeholders: true,
        notes: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(workspaceId: string, companyId: string) {
    const company = await (this.prisma as any).company.findFirst({
      where: { id: companyId, workspaceId },
      include: {
        stakeholders: {
          include: {
            sendingLogs: {
              orderBy: { sentAt: 'desc' },
              take: 10,
            },
            replyLogs: {
              orderBy: { receivedAt: 'desc' },
              take: 10,
            },
          },
        },
        notes: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!company) {
      throw new NotFoundException('Company account not found');
    }

    return company;
  }

  async updateStage(workspaceId: string, companyId: string, dto: UpdateCompanyStageDto) {
    const company = await (this.prisma as any).company.findFirst({
      where: { id: companyId, workspaceId },
    });

    if (!company) {
      throw new NotFoundException('Company account not found');
    }

    return (this.prisma as any).company.update({
      where: { id: companyId },
      data: {
        dealStage: dto.dealStage,
        ...(dto.dealValue !== undefined ? { dealValue: dto.dealValue } : {}),
      },
    });
  }

  async addStakeholder(workspaceId: string, companyId: string, dto: CreateStakeholderDto) {
    const company = await (this.prisma as any).company.findFirst({
      where: { id: companyId, workspaceId },
    });

    if (!company) {
      throw new NotFoundException('Company account not found');
    }

    // Create or link lead as a stakeholder under this company
    const existingLead = await (this.prisma as any).lead.findFirst({
      where: { email: dto.email, workspaceId },
    });

    if (existingLead) {
      return (this.prisma as any).lead.update({
        where: { id: existingLead.id },
        data: {
          companyId,
          company: company.name,
          firstName: dto.firstName || existingLead.firstName,
          lastName: dto.lastName || existingLead.lastName,
          title: dto.title || existingLead.title,
          phone: dto.phone || existingLead.phone,
          linkedinUrl: dto.linkedinUrl || existingLead.linkedinUrl,
        },
      });
    }

    return (this.prisma as any).lead.create({
      data: {
        workspaceId,
        companyId,
        company: company.name,
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        title: dto.title,
        phone: dto.phone,
        linkedinUrl: dto.linkedinUrl,
        status: 'unassigned',
        tags: ['stakeholder'],
      },
    });
  }

  async addNote(workspaceId: string, companyId: string, dto: AddCompanyNoteDto) {
    const company = await (this.prisma as any).company.findFirst({
      where: { id: companyId, workspaceId },
    });

    if (!company) {
      throw new NotFoundException('Company account not found');
    }

    return (this.prisma as any).companyNote.create({
      data: {
        companyId,
        authorName: dto.authorName || 'Sales Rep',
        content: dto.content,
      },
    });
  }

  async sendDirectEmail(workspaceId: string, stakeholderId: string, dto: SendDirectEmailDto) {
    const stakeholder = await (this.prisma as any).lead.findFirst({
      where: { id: stakeholderId, workspaceId },
    });

    if (!stakeholder) {
      throw new NotFoundException('Stakeholder lead not found');
    }

    const inbox = await (this.prisma as any).inbox.findFirst({
      where: { id: dto.inboxId, workspaceId, status: 'active' },
    });

    if (!inbox) {
      throw new BadRequestException('Selected active inbox not found in workspace');
    }

    const logId = uuidv4();
    const formattedMessageId = `<${logId}@indieleads.ai>`;

    // Personalize template tags
    let body = dto.body
      .replace(/{{firstName}}/g, stakeholder.firstName || 'there')
      .replace(/{{lastName}}/g, stakeholder.lastName || '')
      .replace(/{{company}}/g, stakeholder.company || 'your company')
      .replace(/{{title}}/g, stakeholder.title || '');

    // Add signature if set
    if (inbox.signature) {
      body += `<br/><br/>${inbox.signature}`;
    }

    // Create SendingLog entry
    const sendingLog = await (this.prisma as any).sendingLog.create({
      data: {
        id: logId,
        workspaceId,
        inboxId: inbox.id,
        leadId: stakeholder.id,
        status: 'pending',
        attempts: 0,
      },
    });

    try {
      await this.smtpAdapter.sendEmail(inbox, {
        to: stakeholder.email,
        subject: dto.subject,
        body,
        messageId: formattedMessageId,
      });

      await (this.prisma as any).sendingLog.update({
        where: { id: logId },
        data: {
          status: 'sent',
          sentAt: new Date(),
        },
      });

      await (this.prisma as any).lead.update({
        where: { id: stakeholder.id },
        data: {
          status: 'sent',
          lastEventAt: new Date(),
        },
      });

      return {
        success: true,
        logId,
        message: `Direct cold email successfully dispatched to ${stakeholder.email}`,
      };
    } catch (err: any) {
      await (this.prisma as any).sendingLog.update({
        where: { id: logId },
        data: {
          status: 'failed',
          errorMessage: err.message,
        },
      });

      throw new BadRequestException(`Failed to send direct email: ${err.message}`);
    }
  }
}
