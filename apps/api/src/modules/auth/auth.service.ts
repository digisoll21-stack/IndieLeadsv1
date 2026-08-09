
import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { InboxesService } from '../inboxes/inboxes.service';
import { InboxProvider } from '../inboxes/dto/inbox.dto';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { SecurityService } from '../security/security.service';
import { TransactionalEmailService } from '../notifications/transactional-email.service';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';
import { Buffer } from 'buffer';
import axios from 'axios';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly workspacesService: WorkspacesService,
    private readonly inboxesService: InboxesService,
    private readonly securityService: SecurityService,
    private readonly configService: ConfigService,
    private readonly transactionalEmailService: TransactionalEmailService,
    private readonly prisma: PrismaService,
  ) { }

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new ConflictException('User already exists');

    const passwordHash = await this.securityService.hashPassword(dto.password);

    const user = await this.usersService.create({
      ...dto,
      passwordHash,
    });

    const workspace = await this.workspacesService.create(
      { name: dto.workspaceName },
      user.id
    );

    // Generate Verification Token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    await (this.usersService as any).update(user.id, {
      verificationToken
    });

    // Send Verification Email
    await this.transactionalEmailService.sendVerificationEmail(user.email, verificationToken);

    const token = this.generateJwt(user.id, workspace.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      workspace,
      token,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isValid = await this.securityService.verifyPassword(dto.password, user.passwordHash);
    if (!isValid) throw new UnauthorizedException('Invalid credentials');

    const workspaces = await this.workspacesService.findByUser(user.id);
    const workspace = workspaces[0];

    const token = this.generateJwt(user.id, workspace?.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      workspace,
      token,
    };
  }

  async handleGoogleExchange(code: string, workspaceId: string, userId: string) {
    this.logger.log(`Exchanging Google code for tokens: workspace ${workspaceId}`);

    // Anti-CSRF verification check
    const member = await this.prisma.member.findFirst({
      where: { userId, workspaceId }
    });
    if (!member) {
      throw new UnauthorizedException('OAuth state validation failed: Workspace mismatch.');
    }

    try {
      const response = await axios.post('https://oauth2.googleapis.com/token', {
        code,
        client_id: this.configService.get('GOOGLE_CLIENT_ID'),
        client_secret: this.configService.get('GOOGLE_CLIENT_SECRET'),
        redirect_uri: `${this.configService.get('API_URL')}/api/v1/auth/google/callback`,
        grant_type: 'authorization_code',
      });

      const { access_token, refresh_token, expires_in } = response.data;

      // Fetch User Profile
      const profile = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${access_token}` }
      });

      const { email, name } = profile.data;

      // Create Inbox Automatically
      await this.inboxesService.create(workspaceId, {
        email,
        fromName: name,
        provider: InboxProvider.GOOGLE,
        credentials: {
          accessToken: access_token,
          refreshToken: refresh_token,
          expiresAt: Math.floor(Date.now() / 1000) + expires_in,
        } as any
      });

      this.logger.log(`Google Inbox Fulfillment Complete: ${email}`);

      return { access_token, refresh_token };
    } catch (err) {
      this.logger.error(`Google Token Exchange Failed: ${err.message}`);
      throw new UnauthorizedException('Google authentication failed');
    }
  }

  async handleOutlookExchange(code: string, workspaceId: string, userId: string) {
    this.logger.log(`Exchanging Outlook code for tokens: workspace ${workspaceId}`);

    // Anti-CSRF verification check
    const member = await this.prisma.member.findFirst({
      where: { userId, workspaceId }
    });
    if (!member) {
      throw new UnauthorizedException('OAuth state validation failed: Workspace mismatch.');
    }

    try {
      const response = await axios.post(`https://login.microsoftonline.com/common/oauth2/v2.0/token`, new URLSearchParams({
        client_id: this.configService.get('OUTLOOK_CLIENT_ID'),
        client_secret: this.configService.get('OUTLOOK_CLIENT_SECRET'),
        code,
        redirect_uri: `${this.configService.get('API_URL')}/api/v1/auth/outlook/callback`,
        grant_type: 'authorization_code',
      }).toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      const { access_token, refresh_token, expires_in } = response.data;

      // Fetch Profile
      const profile = await axios.get('https://graph.microsoft.com/v1.0/me', {
        headers: { Authorization: `Bearer ${access_token}` }
      });

      const { mail, userPrincipalName, displayName } = profile.data;
      const email = mail || userPrincipalName;

      await this.inboxesService.create(workspaceId, {
        email,
        fromName: displayName,
        provider: InboxProvider.OUTLOOK,
        credentials: {
          accessToken: access_token,
          refreshToken: refresh_token,
          expiresAt: Math.floor(Date.now() / 1000) + expires_in,
        } as any
      });

      return { access_token, refresh_token };
    } catch (err) {
      this.logger.error(`Outlook Token Exchange Failed: ${err.message}`);
      throw new UnauthorizedException('Outlook authentication failed');
    }
  }

  private generateJwt(userId: string, workspaceId?: string): string {
    const secret = this.configService.get('JWT_SECRET');
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({
      sub: userId,
      workspaceId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7) // 7 days
    })).toString('base64url');

    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${header}.${payload}`)
      .digest('base64url');

    return `${header}.${payload}.${signature}`;
  }

  async verifyEmail(token: string) {
    const user = await (this.usersService as any).prisma.user.findUnique({
      where: { verificationToken: token }
    });

    if (!user) throw new UnauthorizedException('Invalid or expired verification token');

    await (this.usersService as any).update(user.id, {
      emailVerifiedAt: new Date(),
      verificationToken: null,
    });

    return { success: true };
  }

  async initiatePasswordReset(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) return { success: true }; // Silent fail for security

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour

    await (this.usersService as any).update(user.id, {
      resetToken,
      resetTokenExpires,
    });

    await this.transactionalEmailService.sendPasswordResetEmail(user.email, resetToken);

    return { success: true };
  }

  async resetPassword(token: string, dto: any) {
    const user = await (this.usersService as any).prisma.user.findUnique({
      where: { resetToken: token }
    });

    if (!user || !user.resetTokenExpires || user.resetTokenExpires < new Date()) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    const passwordHash = await this.securityService.hashPassword(dto.password);

    await (this.usersService as any).update(user.id, {
      passwordHash,
      resetToken: null,
      resetTokenExpires: null,
    });

    return { success: true };
  }
}
