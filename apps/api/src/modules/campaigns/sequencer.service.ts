import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueuesService } from '../queues/queues.service';

/**
 * World-Class Sequencing Engine
 * Features:
 *  - Template variable substitution ({{firstName}}, {{company}}, etc.)
 *  - Work-hours & timezone enforcement (startTime, endTime, workDaysOnly)
 *  - Smart inbox rotation across configured campaign inboxes
 *  - Delay-aware step progression
 */
@Injectable()
export class SequencerService {
    private readonly logger = new Logger(SequencerService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly queuesService: QueuesService,
    ) { }

    // ─────────────────────────────────────────────────────────────────────────
    // PUBLIC ORCHESTRATOR
    // ─────────────────────────────────────────────────────────────────────────

    async processSequences(): Promise<void> {
        this.logger.log('Starting Campaign Sequencing Cycle...');

        const activeCampaigns = await this.prisma.campaign.findMany({
            where: { status: 'active' },
            include: {
                sequences: { orderBy: { order: 'asc' } },
                workspace: true,
            },
        });

        this.logger.log(`Found ${activeCampaigns.length} active campaign(s).`);

        for (const campaign of activeCampaigns) {
            // ── Work-hours gate ──────────────────────────────────────────────
            if (!this.isWithinSendingWindow(campaign.settings as any)) {
                this.logger.log(
                    `Campaign "${campaign.name}" outside sending window — skipping.`
                );
                continue;
            }
            await this.processCampaignLeads(campaign);
        }

        this.logger.log('Campaign Sequencing Cycle Completed.');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // WORK-HOURS ENFORCEMENT
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Returns true if the current wall-clock time (in the campaign's timezone)
     * falls within the configured sending window for the active day.
     */
    private isWithinSendingWindow(settings: {
        startTime?: string;     // "HH:MM" e.g. "09:00"
        endTime?: string;       // "HH:MM" e.g. "17:00"
        timezone?: string;      // IANA tz e.g. "America/New_York"
        workDaysOnly?: boolean;
    }): boolean {
        const {
            startTime = '00:00',
            endTime = '23:59',
            timezone = 'UTC',
            workDaysOnly = false,
        } = settings;

        // Get current local time in the campaign's timezone
        const now = new Date();

        // Use Intl to get day-of-week and HH:MM in the target timezone
        const localParts = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            weekday: 'short',
        }).formatToParts(now);

        const hour = localParts.find(p => p.type === 'hour')?.value ?? '00';
        const minute = localParts.find(p => p.type === 'minute')?.value ?? '00';
        const weekday = localParts.find(p => p.type === 'weekday')?.value ?? 'Mon';

        // Work days gate
        if (workDaysOnly) {
            const isWeekend = weekday === 'Sat' || weekday === 'Sun';
            if (isWeekend) return false;
        }

        // Time window gate (simple string comparison works for HH:MM format)
        const currentTime = `${hour}:${minute}`;
        return currentTime >= startTime && currentTime <= endTime;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LEAD PROCESSING
    // ─────────────────────────────────────────────────────────────────────────

    private async processCampaignLeads(campaign: any): Promise<void> {
        const leads = await (this.prisma as any).lead.findMany({
            where: {
                campaignId: campaign.id,
                // CRITICAL: Only process leads that are still in 'active' lifecycle states
                status: {
                    in: ['pending', 'sent', 'opened', 'clicked'],
                    notIn: ['replied', 'unsubscribed', 'bounced', 'spam_complaint']
                },
            },
            include: {
                sendingLogs: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
        });

        this.logger.log(
            `Campaign "${campaign.name}": evaluating ${leads.length} lead(s).`
        );

        for (const lead of leads) {
            try {
                await this.evaluateLeadProgression(lead, campaign);
            } catch (err) {
                this.logger.error(
                    `Progression failure [Lead: ${lead.email}]: ${err.message}`
                );
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEP PROGRESSION LOGIC
    // ─────────────────────────────────────────────────────────────────────────

    private async evaluateLeadProgression(lead: any, campaign: any): Promise<void> {
        // 0. Double-check Stop on Reply
        const stopOnReply = campaign.settings?.stopOnReply ?? true;
        if (stopOnReply && (lead.status === 'replied' || lead.status === 'unsubscribed')) {
            return;
        }

        const lastLog = lead.sendingLogs[0];

        // 1. Identify next step
        let nextStepIndex = 0;
        if (lastLog?.stepId) {
            const currentStep = campaign.sequences.find(
                (s: any) => s.id === lastLog.stepId
            );
            if (currentStep) {
                nextStepIndex = campaign.sequences.indexOf(currentStep) + 1;
            }
        }

        const nextStep = campaign.sequences[nextStepIndex];
        if (!nextStep) {
            // All steps exhausted for this lead — mark complete
            await (this.prisma as any).lead.update({
                where: { id: lead.id },
                data: { status: 'completed' },
            });
            return;
        }

        // 2. Timing gate — wait until delayDays have elapsed since last send
        if (lastLog) {
            const waitDays = nextStep.delayDays ?? 0;
            const waitMinutes = nextStep.waitMinutes ?? 0;
            const lastSentAt = new Date(lastLog.createdAt);
            const readyAt = new Date(lastSentAt);

            readyAt.setDate(readyAt.getDate() + waitDays);
            readyAt.setMinutes(readyAt.getMinutes() + waitMinutes);

            if (Date.now() < readyAt.getTime()) {
                return; // Still cooling down
            }
        }

        // 3. Inbox selection — smart rotation from campaign's configured inboxIds
        const inbox = await this.selectInbox(campaign, lead.id);
        if (!inbox) {
            this.logger.warn(
                `No active inbox for campaign "${campaign.name}" (workspace: ${campaign.workspaceId})`
            );
            return;
        }

        // 4. Template personalization — substitute variables in subject + body
        const personalizedSubject = this.personalizeTemplate(nextStep.subject, lead);
        const personalizedBody = this.personalizeTemplate(nextStep.body, lead);

        // 5. Create pending SendingLog
        this.logger.log(
            `Queuing: ${lead.email} → Step ${nextStepIndex + 1} via ${inbox.email}`
        );

        const log = await (this.prisma as any).sendingLog.create({
            data: {
                workspaceId: campaign.workspaceId,
                campaignId: campaign.id,
                leadId: lead.id,
                inboxId: inbox.id,
                stepId: nextStep.id,
                status: 'pending',
            },
        });

        // 6. Dispatch the job with personalized content
        await this.queuesService.addSendingJob({
            logId: log.id,
            workspaceId: campaign.workspaceId,
            campaignId: campaign.id,
            leadId: lead.id,
            inboxId: inbox.id,
            stepId: nextStep.id,
            trackOpens: (campaign.settings as any)?.trackOpens ?? true,
            trackClicks: (campaign.settings as any)?.trackClicks ?? false,
            email: {
                to: lead.email,
                subject: personalizedSubject,
                body: personalizedBody,
            },
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // INBOX ROTATION
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Selects an active inbox for sending using a round-robin strategy.
     *
     * Priority order:
     *  1. Campaign's explicitly configured inboxIds (settings.inboxIds)
     *  2. Any active inbox in the workspace (fallback)
     *
     * Rotation is deterministic based on total send count per inbox,
     * always picking the inbox with the fewest sends today (least-loaded).
     */
    private async selectInbox(campaign: any, leadId: string): Promise<any | null> {
        const settings = campaign.settings as any;
        const configuredInboxIds: string[] = settings?.inboxIds ?? [];

        // Build the `where` clause
        const where: any = {
            workspaceId: campaign.workspaceId,
            status: 'active',
        };

        if (configuredInboxIds.length > 0) {
            where.id = { in: configuredInboxIds };
        }

        // Fetch all eligible inboxes
        const inboxes = await this.prisma.inbox.findMany({ where });

        if (inboxes.length === 0) return null;
        if (inboxes.length === 1) return inboxes[0];

        // Least-Loaded Rotation: find the inbox with fewest sends *today*
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const sendCounts = await Promise.all(
            inboxes.map(async (inbox) => {
                const count = await (this.prisma as any).sendingLog.count({
                    where: {
                        inboxId: inbox.id,
                        createdAt: { gte: todayStart },
                        status: { not: 'pending' },
                    },
                });
                return { inbox, count };
            })
        );

        // Sort by least sends today, pick first
        sendCounts.sort((a, b) => a.count - b.count);
        return sendCounts[0].inbox;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TEMPLATE PERSONALIZATION
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Substitutes merge tags in a template string with real lead values.
     *
     * Supported tags:
     *   {{firstName}}   → lead.firstName (or "there" as fallback)
     *   {{lastName}}    → lead.lastName
     *   {{fullName}}    → "FirstName LastName"
     *   {{email}}       → lead.email
     *   {{company}}     → lead.company
     *   {{domain}}      → domain extracted from lead.email
     *   {{customField}} → any key from lead.customFields JSON
     */
    private personalizeTemplate(template: string, lead: any): string {
        if (!template) return template;

        const firstName = lead.firstName?.trim() || 'there';
        const lastName = lead.lastName?.trim() || '';
        const fullName = [firstName !== 'there' ? firstName : '', lastName]
            .filter(Boolean).join(' ') || 'there';
        const company = lead.company?.trim() || '';
        const domain = lead.email?.split('@')[1]?.split('.')[0] || '';
        const customFields: Record<string, string> =
            typeof lead.customFields === 'object' && lead.customFields
                ? lead.customFields
                : {};

        let result = template
            .replace(/\{\{firstName\}\}/gi, firstName)
            .replace(/\{\{lastName\}\}/gi, lastName)
            .replace(/\{\{fullName\}\}/gi, fullName)
            .replace(/\{\{email\}\}/gi, lead.email || '')
            .replace(/\{\{company\}\}/gi, company)
            .replace(/\{\{domain\}\}/gi, domain);

        // Replace any remaining {{customKey}} from lead.customFields
        result = result.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return customFields[key] !== undefined
                ? String(customFields[key])
                : match; // Leave unreplaced if not found
        });

        return result;
    }
}
