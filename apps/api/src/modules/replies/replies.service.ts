
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LeadsService } from '../leads/leads.service';
import { LeadStatus, ReplyCategory } from '@shared/types';
import { GoogleGenAI } from "@google/genai";
import { InboxesService } from '../inboxes/inboxes.service';
import { SmtpAdapter } from '../inboxes/adapters/smtp.adapter';

@Injectable()
export class RepliesService {
  private readonly logger = new Logger(RepliesService.name);
  private aiClient: GoogleGenAI;

  constructor(
    private readonly prisma: PrismaService,
    private readonly leadsService: LeadsService,
    private readonly inboxesService: InboxesService,
    private readonly smtpAdapter: SmtpAdapter,
  ) {
    this.aiClient = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  /**
   * Enterprise-Grade Idempotent Processing
   * Ensures that even if IMAP fetches the same message twice, we only record it once.
   */
  async processDiscoveredReply(workspaceId: string, inboxId: string, rawReply: any) {
    const { from, subject, body, headers, receivedAt, messageId } = rawReply;

    // 1. Idempotency Check: Avoid processing the same messageId twice
    const existing = await this.prisma.replyLog.findFirst({
      where: { messageId, workspaceId }
    });
    if (existing) return;

    // 2. Lead Identification
    const logId = headers?.['x-indieleads-log-id'];
    let lead = null;

    if (logId) {
      const log = await this.prisma.sendingLog.findUnique({ where: { id: logId } });
      if (log) lead = await this.prisma.lead.findUnique({ where: { id: log.leadId } });
    }

    if (!lead) {
      const leads = await this.leadsService.findAll(workspaceId, { search: from });
      lead = leads[0];
    }

    if (!lead) {
      this.logger.debug(`Unknown inbound packet from ${from}. Dropping.`);
      return;
    }

    // 3. AI Sentiment Analysis
    const { category } = await this.classifyReply(body);

    // 4. Atomic Multi-Operation: Save Log & Update Lead State
    await this.prisma.$transaction(async (tx) => {
      await tx.replyLog.create({
        data: {
          workspaceId,
          leadId: lead.id,
          campaignId: lead.campaignId || lead.currentCampaignId || '',
          inboxId,
          messageId,
          subject,
          body,
          classification: category,
          receivedAt: new Date(receivedAt || Date.now()),
          sendingLogId: logId || null,
        }
      });
      await tx.lead.update({
        where: { id: lead.id },
        data: {
          status: category === 'unsubscribe' ? LeadStatus.UNSUBSCRIBED : LeadStatus.REPLIED,
          lastEventAt: new Date()
        }
      });
    });

    this.logger.log(`[REPLY] Categorized ${category} from ${lead.email}`);
  }

  private async classifyReply(body: string): Promise<{ category: ReplyCategory }> {
    try {
      const response = await this.aiClient.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Classify this email reply into exactly one of these: interested, not_interested, unsubscribe, neutral.
        Email: "${body.substring(0, 1000)}"
        Reply only with the category name.`,
        config: { thinkingConfig: { thinkingBudget: 0 } }
      });

      const category = response.text?.trim().toLowerCase() as ReplyCategory;
      return { category: ['interested', 'not_interested', 'unsubscribe', 'neutral'].includes(category) ? category : 'neutral' };
    } catch (error) {
      return { category: 'neutral' };
    }
  }

  async findAll(workspaceId: string, campaignId?: string) {
    const where: any = { workspaceId };
    if (campaignId) where.campaignId = campaignId;
    return this.prisma.replyLog.findMany({
      where,
      include: { lead: true },
      orderBy: { receivedAt: 'desc' }
    });
  }

  /**
   * Manual Reply Dispatch
   * Sends an outbound email to a lead as a threaded response to a specific message.
   */
  async sendReply(workspaceId: string, replyId: string, body: string) {
    const replyLog = await this.prisma.replyLog.findUnique({
      where: { id: replyId },
      include: { lead: true, inbox: true }
    });

    if (!replyLog || replyLog.workspaceId !== workspaceId) {
      throw new Error('REPLY_NOT_FOUND');
    }

    const creds = await this.inboxesService.getDecryptedCredentials(replyLog.inboxId);

    // Dispatch via SMTP
    await this.smtpAdapter.sendEmail(creds, {
      to: replyLog.lead.email,
      fromName: replyLog.inbox.fromName || 'IndieLeads User',
      subject: `Re: ${replyLog.subject}`,
      body,
      inReplyTo: replyLog.messageId,
      references: replyLog.messageId,
      leadId: replyLog.leadId,
      logId: replyLog.sendingLogId // Link back to original campaign log if available
    });

    return { success: true };
  }
}
