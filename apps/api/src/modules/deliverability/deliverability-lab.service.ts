
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InboxesService } from '../inboxes/inboxes.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType, Severity } from '@shared/types';
import { GoogleGenAI } from "@google/genai";
import * as dns from 'dns';
import { promisify } from 'util';

const resolveTxt = promisify(dns.resolveTxt);
const resolveMx = promisify(dns.resolveMx);
const resolveA = promisify(dns.resolve4);

@Injectable()
export class DeliverabilityLabService {
  private readonly logger = new Logger(DeliverabilityLabService.name);
  private ai: GoogleGenAI;

  constructor(
    private readonly prisma: PrismaService,
    private readonly inboxesService: InboxesService,
    private readonly notificationsService: NotificationsService,
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

    // 2. Blacklist (RBL) Checks
    const blacklistInfo = await this.performBlacklistCheck(domainName);

    // 3. AI Content Fingerprinting
    const analysis = await this.analyzeContentWithAI(subject, body);

    // 4. Placement Prediction Heuristics
    const placement = this.predictPlacement(dnsHealth, analysis.spamScore, blacklistInfo.blacklisted);

    const calculatedScore = this.calculateRealScore(dnsHealth, analysis.spamScore, blacklistInfo.blacklisted);

    const test = await this.prisma.deliverabilityTest.create({
      data: {
        workspaceId,
        inboxId,
        subject,
        body,
        status: 'completed',
        score: calculatedScore,
        placement: placement as any,
        dnsHealth: dnsHealth as any,
        recommendations: [
          ...analysis.recommendations,
          ...(blacklistInfo.blacklisted
            ? [`Domain/IP blacklisted on: ${blacklistInfo.lists.join(', ')}. Submit a delisting request.`]
            : [])
        ],
      },
    });

    // 5. Trigger Workspace Alerts for Poor Deliverability
    if (calculatedScore < 70) {
      await this.notificationsService.createAlert({
        workspaceId,
        type: NotificationType.SYSTEM,
        severity: Severity.WARNING,
        title: 'Inbox Deliverability Warning',
        message: `Inbox ${inbox.email} score is low (${calculatedScore}/100). Issues detected: ${
          !dnsHealth.spf ? 'Missing SPF. ' : ''
        }${
          !dnsHealth.dkim ? 'Missing DKIM. ' : ''
        }${
          !dnsHealth.dmarc ? 'Missing DMARC. ' : ''
        }${
          blacklistInfo.blacklisted ? `Blacklisted on ${blacklistInfo.lists.length} server(s). ` : ''
        }Please resolve to maintain healthy sending reputation.`,
        metadata: { inboxId, score: calculatedScore },
      });
    }

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

      // DKIM Check (Heuristic: Auto-prioritize selectors by checking MX servers)
      const mxRecords = await resolveMx(domain).catch(() => []);
      const mxString = mxRecords.map(r => r.exchange.toLowerCase()).join(' ');

      const commonSelectors = ['default', 'google', 'ms', 'api'];
      if (mxString.includes('google.com') || mxString.includes('googlemail.com')) {
        commonSelectors.unshift('google');
      }
      if (mxString.includes('outlook.com') || mxString.includes('mail.protection.outlook.com')) {
        commonSelectors.unshift('selector1', 'selector2');
      }

      const uniqueSelectors = Array.from(new Set(commonSelectors));

      const dkimResults = await Promise.all(
        uniqueSelectors.map(s => resolveTxt(`${s}._domainkey.${domain}`).catch(() => []))
      );
      health.dkim = dkimResults.some(res => res.some(records => records.some(r => r.includes('v=DKIM1'))));

    } catch (err) {
      this.logger.error(`DNS audit failed for ${domain}`, err);
    }

    return health;
  }

  private async performBlacklistCheck(domain: string): Promise<{ blacklisted: boolean; lists: string[] }> {
    const blacklists = [
      'zen.spamhaus.org',
      'bl.spamcop.net',
      'dnsbl.sorbs.net',
      'spam.dnsbl.sorbs.net',
      'b.barracudacentral.org'
    ];

    const listedOn: string[] = [];

    try {
      const ips = await resolveA(domain).catch(() => []);
      if (ips.length > 0) {
        const ip = ips[0];
        const reversedIp = ip.split('.').reverse().join('.');

        await Promise.all(
          blacklists.map(async (bl) => {
            try {
              const lookupHost = `${reversedIp}.${bl}`;
              const records = await resolveA(lookupHost);
              if (records && records.length > 0) {
                listedOn.push(bl);
              }
            } catch {
              // NXDOMAIN / Resolver error implies not listed, which is the expected green state.
            }
          })
        );
      }
    } catch (err) {
      this.logger.warn(`Blacklist lookup skipped or failed for ${domain}`, err);
    }

    return {
      blacklisted: listedOn.length > 0,
      lists: listedOn
    };
  }

  private predictPlacement(dnsHealth: any, spamScore: number, isBlacklisted: boolean) {
    const isHealthy = dnsHealth.spf && dnsHealth.dkim && dnsHealth.dmarc;

    if (!isHealthy || spamScore > 70 || isBlacklisted) {
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

  private calculateRealScore(dnsHealth: any, spamScore: number, isBlacklisted: boolean): number {
    let score = 100;

    // DNS Deductions
    if (!dnsHealth.spf) score -= 30;
    if (!dnsHealth.dkim) score -= 30;
    if (!dnsHealth.dmarc) score -= 15;

    // Content Deductions
    score -= (spamScore / 2);

    // Blacklist Deduction
    if (isBlacklisted) score -= 25;

    return Math.max(0, Math.min(100, Math.round(score)));
  }
}
