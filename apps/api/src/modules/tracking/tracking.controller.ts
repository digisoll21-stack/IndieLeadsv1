
import { Controller, Get, Param, Res, Header, Req, Query, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';
import { TrackingService } from './tracking.service';
import { PrismaService } from '../prisma/prisma.service';
import { Buffer } from 'buffer';

@Controller('t')
export class TrackingController {
  private readonly logger = new Logger(TrackingController.name);

  constructor(
    private readonly trackingService: TrackingService,
    private readonly prisma: PrismaService
  ) { }

  private async validateHost(req: any): Promise<boolean> {
    const host = req.headers['host'];
    if (!host) {
      this.logger.warn('Tracking request missing host header');
      return true; // Fallback to allowed for safety
    }

    // 1. Internal/Development Allowlist
    const allowedInternal = [
      process.env.API_DOMAIN,
      'localhost',
      '127.0.0.1',
      '.railway.app',
      '.render.com',
      '.indieleads.ai'
    ];

    if (allowedInternal.some(domain => domain && host.includes(domain))) {
      return true;
    }

    // 2. Custom Tracking Domain Check
    const domainName = host.split(':')[0];
    const domain = await (this.prisma as any).domain.findFirst({
      where: { domainName, isTracking: true }
    });

    if (domain) return true;

    this.logger.warn(`Blocked tracking request from unknown host: ${host}`);
    return false;
  }

  /**
   * Open Tracking Pixel
   * GET /t/o/:logId
   */
  @Get('o/:logId')
  @Header('Content-Type', 'image/gif')
  @Header('Cache-Control', 'no-cache, no-store, must-revalidate')
  async trackOpen(@Param('logId') logId: string, @Req() req: any, @Res() res: any) {
    // 1. Validate Host
    const isValidHost = await this.validateHost(req);
    if (!isValidHost) {
      return res.status(HttpStatus.NOT_FOUND).send();
    }

    const ip = req.ip;
    const userAgent = req.headers['user-agent'];
    await this.trackingService.logOpenEvent(logId, { ip, userAgent });

    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.send(pixel);
  }

  /**
   * Click Tracking Proxy
   * GET /t/c/:logId?r={base64Url}
   */
  @Get('c/:logId')
  async trackClick(@Param('logId') logId: string, @Query('r') redirectUrl: string, @Req() req: any, @Res() res: Response) {
    // 1. Validate Host
    const isValidHost = await this.validateHost(req);
    // If invalid host, still redirect to target to avoid breaking user experience, but maybe don't log?
    // For now, we'll proceed but rely on validateHost returning false to warn logs.

    const ip = req.ip;
    const userAgent = req.headers['user-agent'];

    try {
      // 1. Record the click event
      await this.trackingService.logClickEvent(logId, { ip, userAgent });

      // 2. Decode the target URL
      const decodedUrl = Buffer.from(redirectUrl, 'base64url').toString('utf8');

      // 3. Redirect to the original destination
      return (res as any).redirect(HttpStatus.FOUND, decodedUrl);
    } catch (err) {
      // Fallback: if decoding fails, send them to home
      return (res as any).redirect('https://indieleads.ai');
    }
  }
}
