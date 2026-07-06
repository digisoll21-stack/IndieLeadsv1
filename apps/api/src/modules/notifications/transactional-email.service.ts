import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class TransactionalEmailService implements OnModuleInit {
  private readonly logger = new Logger(TransactionalEmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly configService: ConfigService) { }

  onModuleInit() {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465, // true for 465, false for other ports
        auth: {
          user,
          pass,
        },
      });
      this.logger.log('Transactional SMTP Transporter initialized.');
    } else {
      this.logger.warn('SMTP not configured. Transactional emails will be LOGGED ONLY.');
    }
  }

  async sendVerificationEmail(email: string, token: string) {
    const frontendUrl = this.configService.get('FRONTEND_URL') || 'https://app.indieleads.ai';
    const verifyUrl = `${frontendUrl}/#/verify-email?token=${token}`;
    const from = this.configService.get('MAIL_FROM') || 'IndieLeads <noreply@indieleads.ai>';

    const subject = 'Verify your IndieLeads account';
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #064e3b; margin-bottom: 24px;">Welcome to IndieLeads!</h1>
        <p>Please click the button below to verify your email address and activate your account:</p>
        <a href="${verifyUrl}" style="display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0;">Verify Email</a>
        <p style="color: #64748b; font-size: 14px;">If you didn't create an account, you can safely ignore this email.</p>
      </div>
    `;

    if (this.transporter) {
      await this.transporter.sendMail({
        from,
        to: email,
        subject,
        html,
      }).catch(err => this.logger.error(`Failed to send verification email to ${email}: ${err.message}`));
    } else {
      this.logger.log(`[DEV LOG] Verification Email: To ${email} | URL: ${verifyUrl}`);
    }
  }

  async sendPasswordResetEmail(email: string, token: string) {
    const frontendUrl = this.configService.get('FRONTEND_URL') || 'https://app.indieleads.ai';
    const resetUrl = `${frontendUrl}/#/reset-password?token=${token}`;
    const from = this.configService.get('MAIL_FROM') || 'IndieLeads <noreply@indieleads.ai>';

    const subject = 'Reset your IndieLeads password';
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #064e3b; margin-bottom: 24px;">Password Reset Request</h1>
        <p>We received a request to reset your password. Click the button below to set a new one:</p>
        <a href="${resetUrl}" style="display: inline-block; background-color: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0;">Reset Password</a>
        <p style="color: #64748b; font-size: 14px;">This link will expire in 1 hour. If you didn't request this, please ignore this email.</p>
      </div>
    `;

    if (this.transporter) {
      await this.transporter.sendMail({
        from,
        to: email,
        subject,
        html,
      }).catch(err => this.logger.error(`Failed to send password reset email to ${email}: ${err.message}`));
    } else {
      this.logger.log(`[DEV LOG] Password Reset Email: To ${email} | URL: ${resetUrl}`);
    }
  }
}
