import { Injectable, Logger } from '@nestjs/common';
import { InboxesService } from '../inboxes/inboxes.service';
import { QueuesService } from '../queues/queues.service';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleGenAI } from "@google/genai";

@Injectable()
export class WarmupService {
  private readonly logger = new Logger(WarmupService.name);
  private ai: GoogleGenAI;

  constructor(
    private readonly prisma: PrismaService,
    private readonly inboxesService: InboxesService,
    private readonly queuesService: QueuesService,
  ) {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async getPoolStats(workspaceId: string) {
    return this.prisma.warmupAccount.findMany({
      where: { inbox: { workspaceId } },
      include: { inbox: true }
    });
  }

  async toggleWarmup(workspaceId: string, inboxId: string, enabled: boolean) {
    return this.prisma.$transaction(async (tx: any) => {
      // 1. Update Inbox flag
      await tx.inbox.update({
        where: { id: inboxId, workspaceId },
        data: { warmupEnabled: enabled }
      });

      // 2. Create WarmupAccount record if enabling for the first time
      let account = await tx.warmupAccount.findUnique({ where: { inboxId } });

      if (!account && enabled) {
        account = await this.prisma.warmupAccount.create({
          data: {
            workspaceId,
            inboxId,
            dailyLimit: 50,
            rampUpPerDay: 5,
            reputationScore: 100,
          }
        });
      }

      return account;
    });
  }

  /**
   * Calculates how many warmup emails an account should send today
   * based on its ramp-up curve (days since enrollment × rampUpPerDay).
   */
  calculateDailyTarget(account: any): number {
    const daysActive = Math.max(
      1,
      Math.floor(
        (Date.now() - new Date(account.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      )
    );
    const target = daysActive * account.rampUpPerDay;
    return Math.min(target, account.dailyLimit);
  }

  /**
   * Generates a realistic, human-like warmup email using Google Gemini.
   * Falls back to a static template on API failure.
   */
  async generateWarmupContent(isReply: boolean = false, context?: string): Promise<{ subject: string; body: string }> {
    try {
      this.logger.debug('Generating AI warmup content...');
      const prompt = isReply
        ? `Generate a brief, positive, human-like professional reply to this email: "${context}". Keep it under 2 sentences. Return as plain text only.`
        : `Generate a random, human-like professional email about a general business topic (productivity, tech trends, or remote work).
           Keep the body under 3 sentences. Return ONLY valid JSON: { "subject": "...", "body": "..." }`;

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: isReply ? {} : { responseMimeType: "application/json" }
      });

      const text = response.text || '{}';
      if (isReply) {
        return {
          subject: `Re: ${context?.substring(0, 50) || 'Our conversation'}`,
          body: text.trim(),
        };
      }

      const data = JSON.parse(text);
      return {
        subject: data.subject || 'Quick question for you',
        body: data.body || 'I was reading about async workflows this morning. Curious how your team handles this — would love to compare notes.',
      };
    } catch (err) {
      this.logger.warn(`AI content generation failed, using fallback: ${err.message}`);
      return {
        subject: 'Quick question',
        body: 'Just wanted to reach out and connect. Hope things are going well on your end — always looking to exchange ideas.',
      };
    }
  }

  /**
   * Master entry point for the warmup scheduler (triggered by cron / BullMQ recurring job).
   * Selects eligible senders and enqueues warmup jobs respecting daily limits.
   */
  async triggerWarmupCycle() {
    this.logger.log('Executing Warmup Cycle...');

    const today = new Date().toISOString().split('T')[0];

    const activeAccounts: any[] = await this.prisma.warmupAccount.findMany({
      where: { inbox: { warmupEnabled: true, status: 'active' } },
      include: { inbox: true }
    });

    let dispatched = 0;

    for (const sender of activeAccounts) {
      const dailyTarget = this.calculateDailyTarget(sender);

      // Reset todaySent if it's a new day
      const lastSentDay = sender.lastSentDate
        ? new Date(sender.lastSentDate).toISOString().split('T')[0]
        : null;

      const currentTodaySent = lastSentDay === today ? sender.todaySent : 0;

      if (currentTodaySent >= dailyTarget) {
        this.logger.debug(`Inbox ${sender.inbox.email} has hit its daily target (${dailyTarget}). Skipping.`);
        continue;
      }

      // Find a random peer from the warmup pool (not the same inbox)
      const recipient = await this.findRandomRecipient(sender.inboxId);
      if (!recipient) {
        this.logger.warn(`No available recipient for ${sender.inbox.email}. Need more inboxes in warmup pool.`);
        continue;
      }

      const content = await this.generateWarmupContent();

      // Stagger sends by a random 1–5 minute delay to appear human
      const staggerMs = Math.floor(Math.random() * 4 + 1) * 60 * 1000;

      await this.queuesService.addWarmupJob({
        senderId: sender.inboxId,
        recipientId: recipient.inboxId,
        subject: content.subject,
        body: content.body,
        isInitial: true,
      }, staggerMs);

      dispatched++;
      this.logger.log(`Queued warmup: ${sender.inbox.email} -> ${recipient.inbox?.email} (delay: ${staggerMs / 1000}s)`);
    }

    this.logger.log(`Warmup Cycle complete. Dispatched ${dispatched} job(s).`);
    return { dispatched, eligible: activeAccounts.length };
  }

  private async findRandomRecipient(excludeInboxId: string): Promise<any> {
    const count = await this.prisma.warmupAccount.count({
      where: { inboxId: { not: excludeInboxId } }
    });

    if (count === 0) return null;

    const skip = Math.floor(Math.random() * count);
    const recipients = await this.prisma.warmupAccount.findMany({
      where: { inboxId: { not: excludeInboxId } },
      skip,
      take: 1,
      include: { inbox: true }
    });

    return recipients[0] || null;
  }
}
