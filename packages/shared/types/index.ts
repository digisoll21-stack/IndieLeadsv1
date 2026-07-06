
/**
 * GLOBAL TYPES
 */

export enum CampaignStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  DRAFT = 'draft',
  COMPLETED = 'completed'
}

export enum InboxProvider {
  GOOGLE = 'google',
  OUTLOOK = 'outlook',
  SMTP = 'smtp'
}

export enum LeadStatus {
  UNASSIGNED = 'unassigned',
  QUEUED = 'queued',
  SENT = 'sent',
  OPENED = 'opened',
  CLICKED = 'clicked',
  REPLIED = 'replied',
  BOUNCED = 'bounced',
  UNSUBSCRIBED = 'unsubscribed',
  SPAM_COMPLAINT = 'spam_complaint',
  PAUSED = 'paused'
}

export enum NotificationType {
  BOUNCE_SPIKE = 'bounce_spike',
  INBOX_DISCONNECTED = 'inbox_disconnected',
  SPAM_COMPLAINT = 'spam_complaint',
  CAMPAIGN_PAUSED = 'campaign_paused',
  LIMIT_REACHED = 'limit_reached',
  SYSTEM = 'system'
}

export enum Severity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical'
}

export interface WorkspaceNotification {
  id: string;
  workspaceId: string;
  type: NotificationType;
  severity: Severity;
  title: string;
  message: string;
  isRead: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface AuditLog {
  id: string;
  workspaceId: string;
  userId: string;
  userEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  createdAt: Date;
}

export enum BounceType {
  HARD = 'hard',
  SOFT = 'soft',
  SPAM = 'spam',
}

export type ReplyCategory = 'interested' | 'not_interested' | 'unsubscribe' | 'neutral' | 'out_of_office';

export interface Workspace {
  id: string;
  name: string;
  createdAt: Date;
}

export interface WarmupAccount {
  id: string;
  inboxId: string;
  workspaceId: string;
  status: 'active' | 'paused';
  dailyLimit: number;
  currentDailyCount: number;
  rampUpPerDay: number;
  startDate: Date;
  totalSent: number;
  totalReceived: number;
  reputationScore: number;
}

export interface DeliverabilityTest {
  id: string;
  workspaceId: string;
  inboxId: string;
  status: 'pending' | 'completed' | 'failed';
  score: number;
  placement: {
    gmail: 'primary' | 'promotions' | 'spam' | 'not_received';
    outlook: 'primary' | 'other' | 'spam' | 'not_received';
    yahoo: 'primary' | 'spam' | 'not_received';
    icloud: 'primary' | 'spam' | 'not_received';
  };
  dnsHealth: {
    spf: boolean;
    dkim: boolean;
    dmarc: boolean;
  };
  recommendations: string[];
  createdAt: Date;
}

export interface Campaign {
  id: string;
  workspaceId: string;
  name: string;
  status: CampaignStatus;
  settings: CampaignSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface CampaignSettings {
  stopOnReply: boolean;
  trackOpens: boolean;
  trackClicks: boolean;
  dailyLimit: number;
  inboxIds: string[];
  workDaysOnly: boolean;
  startTime: string; 
  endTime: string;   
  timezone: string;  
  minDelaySeconds: number;
  maxDelaySeconds: number;
  autoPauseOnBounceRate: number; 
  autoPauseOnSpamComplaint: boolean;
}

export interface SequenceStep {
  id: string;
  campaignId: string;
  order: number;
  subject: string;
  body: string;
  delayDays: number;
}

export interface Lead {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  status: LeadStatus;
  tags: string[];
  customFields: Record<string, string>;
  lastEventAt?: Date;
  workspaceId: string;
  currentCampaignId?: string;
  currentStepOrder?: number;
}

export interface ReplyLog {
  id: string;
  workspaceId: string;
  leadId: string;
  campaignId: string;
  inboxId: string;
  messageId: string;
  threadId: string;
  subject: string;
  body: string;
  snippet: string;
  receivedAt: Date;
  classification: ReplyCategory;
  confidence: number;
  sentiment?: 'positive' | 'neutral' | 'negative' | 'unsubscribed';
}
