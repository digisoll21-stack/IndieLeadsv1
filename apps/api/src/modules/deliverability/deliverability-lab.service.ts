
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InboxesService } from '../inboxes/inboxes.service';
import { GoogleGenAI } from "@google/genai";
import * as dns from 'dns';
import { promisify } from 'util';

const resolveTxt = promisify(dns.resolveTxt);

@Injectable()
export class DeliverabilityLabService {
  private readonly logger = new Logger(DeliverabilityLabService.name);
  private ai: GoogleGenAI;

  constructor(
    private readonly prisma: PrismaService,
    private readonly inboxesService: InboxesService,
  ) {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async getHistory(workspaceId: string) {
    return this.prisma.deliverabilityTest.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTest(workspaceId: string, id: string) {
    const test = await this.prisma.deliverabilityTest.findFirst({
      where: { id, workspaceId },
    });
    if (!test) throw new NotFoundException('Test not found');
    return test;
  }

  async runTest(workspaceId: string, inboxId: string, subject: string, body: string) {
    this.logger.log(`Running Deliverability Lab test for inbox ${inboxId}`);

    const inbox = await this.inboxesService.findOne(workspaceId, inboxId);
    const domainName = inbox.email.split('@')[1];

    // 1. Real DNS Checks
    const dnsHealth = await this.performDnsAudit(domainName);

    // 2. AI Content Fingerprinting
    const analysis = await this.analyzeContentWithAI(subject, body);

    // 3. Placement Prediction Heuristics
    const placement = this.predictPlacement(dnsHealth, analysis.spamScore);

    const test = await this.prisma.deliverabilityTest.create({
      data: {
        workspaceId,
        inboxId,
        subject,
        body,
        status: 'completed',
        score: this.calculateRealScore(dnsHealth, analysis.spamScore),
        placement: placement as any,
        dnsHealth: dnsHealth as any,
        recommendations: analysis.recommendations,
      },
    });

    return test;
  }

  private async performDnsAudit(domain: string) {
    const health = { spf: false, dkim: false, dmarc: false };

    try {
      // SPF Check
      const txtRecords = await resolveTxt(domain).catch(() => []);
      health.spf = txtRecords.some(records => records.some(r => r.includes('v=spf1')));

      // DMARC Check
      const dmarcRecords = await resolveTxt(`_dmarc.${domain}`).catch(() => []);
      health.dmarc = dmarcRecords.some(records => records.some(r => r.includes('v=DMARC1')));

      // DKIM Check (Heuristic: Check common selectors if specific one is unknown)
      // For cold email SaaS, we often use 'google', 'default', 'mandrill', etc.
      const commonSelectors = ['google', 'default', 'ms', 'api'];
      const dkimResults = await Promise.all(
        commonSelectors.map(s => resolveTxt(`${s}._domainkey.${domain}`).catch(() => []))
      );
      health.dkim = dkimResults.some(res => res.some(records => records.some(r => r.includes('v=DKIM1'))));

    } catch (err) {
      this.logger.error(`DNS audit failed for ${domain}`, err);
    }

    return health;
  }

  private predictPlacement(dnsHealth: any, spamScore: number) {
    // Heuristic placement prediction
    const isHealthy = dnsHealth.spf && dnsHealth.dkim && dnsHealth.dmarc;

    if (!isHealthy || spamScore > 70) {
      return { gmail: 'spam', outlook: 'spam', yahoo: 'spam', icloud: 'spam' };
    }

    if (spamScore > 40) {
      return { gmail: 'promotions', outlook: 'primary', yahoo: 'primary', icloud: 'primary' };
    }

    return { gmail: 'primary', outlook: 'primary', yahoo: 'primary', icloud: 'primary' };
  }

  private async analyzeContentWithAI(subject: string, body: string) {
    try {
      const prompt = `Act as a Deliverability Expert. Analyze the following cold email for spam triggers, blacklisted keywords, and formatting issues.
      Subject: ${subject}
      Body: ${body}
      
      Return JSON with: { "spamScore": 0-100, "recommendations": ["string"] }`;

      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });

      const result = JSON.parse(response.text || '{}');
      return {
        spamScore: result.spamScore ?? 20,
        recommendations: result.recommendations ?? ["Optimize subject line length", "Check for tracking pixel usage"]
      };
    } catch (err) {
      this.logger.error('AI analysis failed', err);
      return { spamScore: 10, recommendations: ["Ensure valid unsubscribe links", "Avoid excessive HTML formatting"] };
    }
  }

  private calculateRealScore(dnsHealth: any, spamScore: number): number {
    let score = 100;

    // DNS Deductions
    if (!dnsHealth.spf) score -= 30;
    if (!dnsHealth.dkim) score -= 30;
    if (!dnsHealth.dmarc) score -= 15;

    // Content Deductions
    score -= (spamScore / 2);

    return Math.max(0, Math.min(100, Math.round(score)));
  }
}
