
import { Injectable, Logger } from '@nestjs/common';
import { EmailProviderAdapter, ProviderHealth, ValidationResult } from './provider.adapter';

@Injectable()
export class GmailAdapter implements EmailProviderAdapter {
  private readonly logger = new Logger(GmailAdapter.name);

  async validateCredentials(credentials: any): Promise<ValidationResult> {
    this.logger.debug('Validating Google OAuth tokens...');
    if (!credentials.accessToken) return { isValid: false, error: 'Missing Google OAuth access token.' };
    return { isValid: true };
  }

  async sendEmail(credentials: any, payload: any): Promise<{ messageId: string }> {
    this.logger.debug(`Sending Gmail from ${payload.from}`);
    return { messageId: `g_${Date.now()}` };
  }

  async fetchReplies(credentials: any, lastCheck: Date): Promise<any[]> {
    this.logger.debug(`Fetching Gmail replies since ${lastCheck.toISOString()}`);
    // Real implementation would use:
    // gmail.users.messages.list({ q: `after:${lastCheck.getTime() / 1000} label:INBOX -label:SENT` })
    return [];
  }

  async healthCheck(credentials: any): Promise<ProviderHealth> {
    return { status: 'active', score: 98 };
  }
}
