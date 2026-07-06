import { Injectable, Logger } from '@nestjs/common';
import { EmailProviderAdapter, ProviderHealth, ValidationResult } from './provider.adapter';
import * as nodemailer from 'nodemailer';
import * as imaps from 'imap-simple';
import { simpleParser } from 'mailparser';

@Injectable()
export class SmtpAdapter implements EmailProviderAdapter {
  private readonly logger = new Logger(SmtpAdapter.name);

  async validateCredentials(credentials: any): Promise<ValidationResult> {
    const TIMEOUT_MS = 10000;

    const smtpCheck = async (): Promise<ValidationResult> => {
      return new Promise((resolve) => {
        const timer = setTimeout(() => {
          resolve({ isValid: false, error: 'SMTP connection timed out. Check your host, port and firewall settings.' });
        }, TIMEOUT_MS);

        const auth: any = credentials.accessToken
          ? { type: 'OAuth2', user: credentials.smtpUser, accessToken: credentials.accessToken }
          : { user: credentials.smtpUser, pass: credentials.smtpPass };

        // Defensive host fallback if missing
        let host = credentials.smtpHost;
        if (!host) {
          const email = credentials.smtpUser || '';
          if (email.endsWith('@gmail.com')) host = 'smtp.gmail.com';
          else if (email.endsWith('@outlook.com') || email.endsWith('@hotmail.com')) host = 'smtp.office365.com';
        }

        const transporter = nodemailer.createTransport({
          host: host || (credentials.accessToken ? 'smtp.gmail.com' : undefined),
          port: credentials.smtpPort || 587, // Default to 587 for better cloud reach
          secure: Number(credentials.smtpPort) === 465,
          auth,
          tls: { rejectUnauthorized: false },
          connectionTimeout: TIMEOUT_MS,
          greetingTimeout: TIMEOUT_MS,
          socketTimeout: TIMEOUT_MS,
          // Force IPv4: Render cannot route IPv6 to Gmail SMTP (ENETUNREACH)
          family: 4,
          // Custom lookup to strictly force IPv4 at the DNS level
          lookup: (hostname, options, callback) => {
            require('dns').lookup(hostname, { ...options, family: 4 }, callback);
          }
        } as any);

        transporter.verify()
          .then(() => { clearTimeout(timer); resolve({ isValid: true }); })
          .catch((err) => {
            clearTimeout(timer);
            const message = this.humanizeSmtpError(err);
            this.logger.error(`SMTP check failed for ${credentials.smtpUser}: ${err.message}`);
            resolve({ isValid: false, error: message });
          });
      });
    };

    const imapCheck = async (): Promise<ValidationResult> => {
      return new Promise((resolve) => {
        const timer = setTimeout(() => {
          resolve({ isValid: false, error: 'IMAP connection timed out. Check your IMAP host and port.' });
        }, TIMEOUT_MS);

        const config: any = {
          imap: {
            user: credentials.imapUser || credentials.smtpUser,
            password: credentials.imapPass || credentials.smtpPass,
            host: credentials.imapHost || (credentials.accessToken ? 'imap.gmail.com' : undefined),
            port: credentials.imapPort || 993,
            tls: true,
            authTimeout: TIMEOUT_MS,
            tlsOptions: { rejectUnauthorized: false },
          }
        };

        if (credentials.accessToken) {
          config.imap.xoauth2 = credentials.accessToken;
          delete config.imap.password;
        }

        imaps.connect(config)
          .then(async (conn) => {
            clearTimeout(timer);
            await conn.end();
            resolve({ isValid: true });
          })
          .catch((err) => {
            clearTimeout(timer);
            const message = this.humanizeImapError(err);
            this.logger.error(`IMAP check failed for ${config.imap.user}: ${err.message}`);
            resolve({ isValid: false, error: message });
          });
      });
    };

    const [smtpResult, imapResult] = await Promise.all([smtpCheck(), imapCheck()]);

    if (!smtpResult.isValid) return smtpResult;
    if (!imapResult.isValid) return imapResult;
    return { isValid: true };
  }

  private humanizeSmtpError(err: any): string {
    const msg = (err.message || '').toLowerCase();
    if (msg.includes('invalid login') || msg.includes('authentication failed') || msg.includes('535') || msg.includes('incorrect') || msg.includes('bad credentials')) {
      return 'SMTP: Invalid credentials. For Google/Microsoft use an App Password, not your account password.';
    }
    if (msg.includes('econnrefused') || msg.includes('connect econnrefused')) {
      return `SMTP: Connection refused on port ${err.port || 'specified'}. Check your SMTP host and port.`;
    }
    if (msg.includes('enotfound') || msg.includes('getaddrinfo')) {
      return 'SMTP: Hostname not found. Check your SMTP host address.';
    }
    if (msg.includes('etimeout') || msg.includes('timeout')) {
      return 'SMTP: Connection timed out. Check your host, port and firewall settings.';
    }
    if (msg.includes('self signed') || msg.includes('certificate')) {
      return 'SMTP: TLS certificate error. Try switching the port.';
    }
    return `SMTP Error: ${err.message}${err.code ? ` (${err.code})` : ''}${err.address ? ` to ${err.address}` : ''}`;
  }

  private humanizeImapError(err: any): string {
    const msg = (err.message || '').toLowerCase();
    if (msg.includes('invalid credentials') || msg.includes('authenticationfailed') || msg.includes('login failed')) {
      return 'IMAP: Invalid credentials. For Google, ensure IMAP is enabled in Gmail settings.';
    }
    if (msg.includes('econnrefused')) {
      return 'IMAP: Connection refused. Check your IMAP host and port.';
    }
    if (msg.includes('enotfound')) {
      return 'IMAP: Hostname not found. Check your IMAP host address.';
    }
    if (msg.includes('timeout') || msg.includes('timedout')) {
      return 'IMAP: Connection timed out. Check your IMAP host and port.';
    }
    return `IMAP Error: ${err.message}`;
  }


  async sendEmail(credentials: any, payload: any): Promise<{ messageId: string }> {
    const auth: any = credentials.accessToken ? {
      type: 'OAuth2',
      user: credentials.smtpUser,
      accessToken: credentials.accessToken,
    } : {
      user: credentials.smtpUser,
      pass: credentials.smtpPass,
    };

    // Defensive host fallback if missing
    let host = credentials.smtpHost;
    if (!host) {
      const email = credentials.smtpUser || '';
      if (email.endsWith('@gmail.com')) host = 'smtp.gmail.com';
      else if (email.endsWith('@outlook.com') || email.endsWith('@hotmail.com')) host = 'smtp.office365.com';
    }

    const transporter = nodemailer.createTransport({
      host: host || (credentials.accessToken ? 'smtp.gmail.com' : undefined),
      port: credentials.smtpPort || 587, // Default to 587 for better cloud reach
      secure: Number(credentials.smtpPort) === 465,
      auth,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
      tls: { rejectUnauthorized: false },
      // Force IPv4: Render cannot route IPv6 to Gmail SMTP (ENETUNREACH)
      family: 4,
      // Custom lookup to strictly force IPv4 at the DNS level
      lookup: (hostname, options, callback) => {
        require('dns').lookup(hostname, { ...options, family: 4 }, callback);
      }
    } as any);

    try {
      const info = await transporter.sendMail({
        from: `"${payload.fromName || 'IndieLeads User'}" <${credentials.smtpUser}>`,
        to: payload.to,
        subject: payload.subject,
        html: payload.body,
        headers: {
          'X-IndieLeads-Log-ID': payload.logId,
          'Message-ID': `<${payload.logId || Math.random().toString(36).substring(7)}@indieleads.ai>`,
          'List-Unsubscribe': `<${process.env.FRONTEND_URL}/#/unsub/${payload.leadId}>`,
          ...(payload.inReplyTo ? { 'In-Reply-To': payload.inReplyTo } : {}),
          ...(payload.references ? { 'References': payload.references } : {}),
        }
      });
      return { messageId: info.messageId };
    } catch (err) {
      this.logger.error(`SMTP Dispatch Error: ${err.message}`);
      // Throw a human-readable error so the user knows exactly what went wrong
      const msg = (err.message || '').toLowerCase();
      if (msg.includes('invalid login') || msg.includes('535') || msg.includes('authentication') || msg.includes('credentials')) {
        throw new Error('Invalid credentials. Make sure you are using a Gmail App Password, not your regular account password.');
      }
      if (msg.includes('econnrefused') || msg.includes('enotfound') || msg.includes('getaddrinfo') || msg.includes('enetunreach')) {
        throw new Error(`Cannot reach SMTP server at ${host || 'smtp.gmail.com'}. Reason: ${err.message}. Check your host settings or try port 587.`);
      }
      if (msg.includes('timeout') || msg.includes('etimeout')) {
        throw new Error(`SMTP connection timed out. Your hosting provider (Render) may be blocking port ${credentials.smtpPort || 465}. Try port 587.`);
      }
      throw new Error(err.message || 'Email provider rejected the request.');
    }
  }

  /**
   * Fetches replies from the IMAP server.
   * Logic: Look for messages SINCE lastCheck that contain our custom header.
   */
  async fetchReplies(credentials: any, lastCheck: Date): Promise<any[]> {
    this.logger.log(`Scanning IMAP stream for ${credentials.imapUser || credentials.smtpUser} since ${lastCheck.toISOString()}`);

    const config: any = {
      imap: {
        user: credentials.imapUser || credentials.smtpUser,
        host: credentials.imapHost || (credentials.accessToken ? 'imap.gmail.com' : undefined),
        port: credentials.imapPort || 993,
        tls: true,
        authTimeout: 10000,
        tlsOptions: { rejectUnauthorized: false }
      }
    };

    if (credentials.accessToken) {
      config.imap.xoauth2 = credentials.accessToken;
    } else {
      config.imap.password = credentials.imapPass || credentials.smtpPass;
    }

    let connection;
    try {
      connection = await imaps.connect(config);
      await connection.openBox('INBOX');

      // Search for messages since lastCheck. 
      // Note: IMAP search only supports Date (day resolution) for 'SINCE'.
      // We'll filter precisely in JS afterwards if needed.
      const searchCriteria = [['SINCE', lastCheck]];
      const fetchOptions = {
        bodies: ['HEADER', 'TEXT'],
        struct: true
      };

      const messages = await connection.search(searchCriteria, fetchOptions);
      const replies = [];

      for (const item of messages) {
        const allHeaderPart = item.parts.find(part => part.which === 'HEADER');
        const id = item.attributes.uid;
        const idHeader = allHeaderPart.body['message-id'];

        // Optimization: Use simple-parser for robust body/header extraction
        const fullMessage = item.parts.map(p => p.body).join('\n');
        const parsed = await simpleParser(fullMessage);

        const indieleadsLogId = parsed.headers.get('x-indieleads-log-id') ||
          parsed.headers.get('references')?.toString().match(/<([^@]+)@indieleads\.ai>/)?.[1];

        if (indieleadsLogId) {
          replies.push({
            messageId: parsed.messageId || idHeader?.[0] || id.toString(),
            from: parsed.from?.value[0]?.address,
            subject: parsed.subject,
            body: parsed.text || parsed.html,
            headers: {
              'x-indieleads-log-id': indieleadsLogId
            },
            receivedAt: parsed.date || item.attributes.date
          });
        }
      }

      await connection.end();
      return replies;

    } catch (err) {
      this.logger.error(`IMAP Sync Failure for ${config.imap.user}: ${err.message}`);
      if (connection) await connection.end();
      return [];
    }
  }

  async healthCheck(credentials: any): Promise<ProviderHealth> {
    const result = await this.validateCredentials(credentials);
    return {
      status: result.isValid ? 'active' : 'disconnected',
      score: result.isValid ? 100 : 0
    };
  }
}
