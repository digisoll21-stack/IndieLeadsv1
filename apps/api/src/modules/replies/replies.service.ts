
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

    let draftReply: string | null = null;
    if (category === 'objection') {
      draftReply = await this.generateDraftReply(workspaceId, body);
    }

    const customFields = (lead.customFields as Record<string, any>) || {};
    let leadStatus = LeadStatus.REPLIED;

    if (category === 'unsubscribe') {
      leadStatus = LeadStatus.UNSUBSCRIBED;
    } else if (category === 'out_of_office') {
      leadStatus = LeadStatus.OUT_OF_OFFICE;
      const snoozeUntil = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days
      customFields.snoozeUntil = snoozeUntil.toISOString();
    } else if (category === 'check_in_later') {
      leadStatus = LeadStatus.CHECK_IN_LATER;
      const snoozeUntil = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60 days
      customFields.snoozeUntil = snoozeUntil.toISOString();
    } else if (category === 'objection') {
      leadStatus = LeadStatus.OBJECTION;
    }

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
          draftReply,
        }
      });
      await tx.lead.update({
        where: { id: lead.id },
        data: {
          status: leadStatus,
          customFields: Object.keys(customFields).length > 0 ? customFields : undefined,
          lastEventAt: new Date()
        }
      });
    });

    this.logger.log(`[REPLY] Categorized ${category} from ${lead.email}`);
  }

  private async generateDraftReply(workspaceId: string, replyBody: string): Promise<string | null> {
    try {
      const knowledge = await (this.prisma as any).workspaceKnowledge.findUnique({
        where: { workspaceId }
      });

      const brandContext = knowledge ? knowledge.content : 'No detailed product info available.';

      const prompt = `You are a helpful sales assistant. A prospect sent this reply:
      "${replyBody.substring(0, 1000)}"

      Using the following company/product knowledge base, draft a polite, concise, and helpful response addressing their questions or concerns. Focus on getting them to book a quick call if appropriate.

      Knowledge Base:
      ${brandContext}

      Draft response (write ONLY the email body. Do not include subject lines or placeholders like [Name]):`;

      const response = await this.aiClient.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { thinkingConfig: { thinkingBudget: 0 } }
      });

      return response.text?.trim() || null;
    } catch (error) {
      this.logger.error(`Failed to generate draft reply: ${error.message}`);
      return null;
    }
  }

  private async classifyReply(body: string): Promise<{ category: ReplyCategory }> {
    try {
      const response = await this.aiClient.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Classify this email reply into exactly one of these categories:
- interested (wants to meet, book a call, get more details, positive reply)
- not_interested (polite or direct rejection, doesn't want services)
- unsubscribe (asks to be removed, unsubscribe, stop emailing, "don't email me again")
- out_of_office (autoreply, holiday, away, returning on a date)
- check_in_later (asks to follow up in a month, next quarter, next year, later time)
- objection (has technical questions, doubts, pricing questions, specific concerns)
- neutral (none of the above, or unclear)

Email: "${body.substring(0, 1000)}"
Reply only with the category name in lowercase.`,
        config: { thinkingConfig: { thinkingBudget: 0 } }
      });

      const category = response.text?.trim().toLowerCase() as ReplyCategory;
      const validCategories: ReplyCategory[] = ['interested', 'not_interested', 'unsubscribe', 'neutral', 'out_of_office', 'check_in_later', 'objection'];
      return { category: validCategories.includes(category) ? category : 'neutral' };
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
