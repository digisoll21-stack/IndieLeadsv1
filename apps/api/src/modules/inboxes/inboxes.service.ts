import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SecurityService } from '../security/security.service';
import { PlanEnforcementService } from '../workspaces/plan-enforcement.service';
import { CreateInboxDto, UpdateInboxSettingsDto, InboxProvider } from './dto/inbox.dto';
import { SmtpAdapter } from './adapters/smtp.adapter';

@Injectable()
export class InboxesService {
  private readonly logger = new Logger(InboxesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly security: SecurityService,
    private readonly smtpAdapter: SmtpAdapter,
    private readonly planEnforcement: PlanEnforcementService,
  ) { }

  /**
   * Initializes and connects a new email account to the workspace.
   */
  async create(workspaceId: string, dto: CreateInboxDto) {
    this.logger.log(`Initiating account connection for: ${dto.email}`);

    // Plan Enforcement: Check if workspace has reached its inbox limit
    await this.planEnforcement.checkInboxLimit(workspaceId);

    // Pre-validation: Prevent duplicate accounts
    const existing = await this.prisma.inbox.findUnique({
      where: { email: dto.email }
    });

    if (existing) {
      throw new BadRequestException(`Email account ${dto.email} is already registered. Duplicate accounts are not permitted.`);
    }

    // Dynamic configuration for managed providers
    if (dto.provider === InboxProvider.GOOGLE && (!dto.credentials.smtpHost)) {
      dto.credentials.smtpHost = 'smtp.gmail.com';
      dto.credentials.smtpPort = 587; // Port 587 is more reliable on cloud PaaS
      dto.credentials.imapHost = 'imap.gmail.com';
      dto.credentials.imapPort = 993;
    } else if (dto.provider === InboxProvider.OUTLOOK && (!dto.credentials.smtpHost)) {
      dto.credentials.smtpHost = 'smtp.office365.com';
      dto.credentials.smtpPort = 587;
      dto.credentials.imapHost = 'outlook.office365.com';
      dto.credentials.imapPort = 993;
    }

    // NOTE: We intentionally skip live SMTP/IMAP validation here.
    // Cloud PaaS providers (Render, Railway, Fly.io) block outbound SMTP ports (465/587/993)
    // to prevent spam abuse. A live connection test would always time out.
    // Instead, credentials are saved and validated on first actual send.
    // Invalid credentials will show up as 'disconnected' on the health check page.
    this.logger.log(`Skipping live SMTP check (blocked by PaaS firewall) for: ${dto.email}`);

    // Automated Domain Management
    const domainName = dto.email.split('@')[1];
    let domain = await this.prisma.domain.findFirst({
      where: { domainName, workspaceId }
    });

    if (!domain) {
      domain = await this.prisma.domain.create({
        data: {
          workspaceId,
          domainName,
          isVerified: false,
          spfValid: false,
          dkimValid: false,
          dmarcValid: false
        }
      });
    }

    // Secure credential persistence
    const encryptedCreds = this.security.encrypt(JSON.stringify(dto.credentials));

    return this.prisma.inbox.create({
      data: {
        workspaceId,
        domainId: domain.id,
        email: dto.email,
        fromName: dto.fromName || dto.email.split('@')[1], // Fallback to domain or part of email
        provider: dto.provider,
        credentials: encryptedCreds,
        status: 'active',
        dailyLimit: dto.provider === InboxProvider.GOOGLE ? 50 : 100,
        hourlyLimit: 15,
        minDelaySeconds: 60,
        maxDelaySeconds: 300
      }
    });
  }

  /**
   * Retrieves all accounts for a workspace with pagination.
   */
  async findAll(workspaceId: string, page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = { workspaceId };

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { fromName: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [data, total] = await Promise.all([
      (this.prisma as any).inbox.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          fromName: true,
          provider: true,
          status: true,
          dailyLimit: true,
          hourlyLimit: true,
          warmupEnabled: true,
          minDelaySeconds: true,
          maxDelaySeconds: true,
          signature: true,
          createdAt: true,
          updatedAt: true,
          domain: true,
          warmupAccount: {
            select: {
              reputationScore: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.inbox.count({ where })
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

  /**
   * Retrieves a single account details.
   */
  async findOne(workspaceId: string, id: string) {
    const inbox = await this.prisma.inbox.findFirst({
      where: { id, workspaceId },
      include: { domain: true }
    });
    if (!inbox) throw new NotFoundException('Account not found in workspace.');
    return inbox;
  }

  /**
   * Updates account settings.
   */
  async updateSettings(workspaceId: string, id: string, dto: UpdateInboxSettingsDto) {
    const inbox = await this.findOne(workspaceId, id);
    return this.prisma.inbox.update({
      where: { id: inbox.id },
      data: { ...dto }
    });
  }

  /**
   * Bulk updates settings across multiple accounts.
   */
  async bulkUpdate(workspaceId: string, dto: any) {
    const { inboxIds, ...settings } = dto;

    const inboxes = await this.prisma.inbox.findMany({
      where: {
        id: { in: inboxIds },
        workspaceId
      }
    });

    if (inboxes.length !== inboxIds.length) {
      throw new BadRequestException('Some accounts were not found in the workspace.');
    }

    const updateData = Object.fromEntries(
      Object.entries(settings).filter(([_, v]) => v !== undefined && v !== '')
    );

    if (Object.keys(updateData).length === 0) {
      return { count: 0, message: 'No updates performed.' };
    }

    return this.prisma.inbox.updateMany({
      where: {
        id: { in: inboxIds },
        workspaceId
      },
      data: updateData
    });
  }

  /**
   * Performs a health check and updates status.
   */
  async checkHealth(workspaceId: string, id: string) {
    const inbox = await this.findOne(workspaceId, id);
    const creds = await this.getDecryptedCredentials(id);
    const health = await this.smtpAdapter.healthCheck(creds);

    return this.prisma.inbox.update({
      where: { id },
      data: { status: health.status }
    });
  }

  /**
   * Permanently removes an account.
   */
  async remove(workspaceId: string, id: string) {
    const inbox = await this.findOne(workspaceId, id);
    return this.prisma.inbox.delete({ where: { id: inbox.id } });
  }

  /**
   * Retrieves and decrypts credentials for system operations.
   * Includes auto-migration for legacy configurations (e.g. port 465 -> 587 for Gmail).
   */
  async getDecryptedCredentials(id: string) {
    const inbox = await this.prisma.inbox.findUnique({ where: { id } });
    if (!inbox) throw new NotFoundException('Account credentials not found.');
    const decrypted = this.security.decrypt(inbox.credentials);
    const creds = JSON.parse(decrypted);

    // Auto-migrate legacy Gmail configurations to more stable settings
    if (inbox.provider === InboxProvider.GOOGLE || creds.smtpUser?.endsWith('@gmail.com')) {
      if (!creds.smtpHost) creds.smtpHost = 'smtp.gmail.com';
      if (Number(creds.smtpPort) === 465 || !creds.smtpPort) creds.smtpPort = 587;
    } else if (inbox.provider === InboxProvider.OUTLOOK || creds.smtpUser?.endsWith('@outlook.com')) {
      if (!creds.smtpHost) creds.smtpHost = 'smtp.office365.com';
      if (Number(creds.smtpPort) === 465 || !creds.smtpPort) creds.smtpPort = 587;
    }

    return creds;
  }

  /**
   * Sends a test email to verify configuration.
   */
  async sendTestEmail(workspaceId: string, id: string, to: string, subject: string, body: string) {
    const inbox = await this.findOne(workspaceId, id);
    const creds = await this.getDecryptedCredentials(id);

    await this.smtpAdapter.sendEmail(creds, {
      fromName: inbox.fromName,
      to,
      subject: `[TEST] ${subject}`,
      body,
      logId: `test-${Date.now()}`,
      leadId: 'test-lead'
    });
    return { success: true };
  }
}