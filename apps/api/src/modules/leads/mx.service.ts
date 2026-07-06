import { Injectable, Logger } from '@nestjs/common';
import * as dns from 'dns';

@Injectable()
export class MxService {
  private readonly logger = new Logger(MxService.name);

  /**
   * Verify if an email domain has valid MX records.
   */
  async verifyMx(email: string): Promise<boolean> {
    const domain = email.split('@')[1];
    if (!domain) return false;

    const commonBanned = ['example.com', 'test.com', 'temp-mail.org'];
    if (commonBanned.includes(domain)) return false;

    try {
      const records = await dns.promises.resolveMx(domain);
      return records && records.length > 0;
    } catch (err) {
      this.logger.error(`MX Lookup failed for ${domain}: ${err.message}`);
      return false;
    }
  }
}
