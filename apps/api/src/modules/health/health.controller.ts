
import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueuesService } from '../queues/queues.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queuesService: QueuesService
  ) { }

  @Get()
  async check() {
    try {
      // 1. Database Pulse
      await this.prisma.$queryRaw`SELECT 1`;

      // 2. Redis/Queue Pulse
      const queueStats = await this.queuesService.getQueueStatus();

      return {
        status: 'UP',
        timestamp: new Date().toISOString(),
        services: {
          database: 'CONNECTED',
          redis: 'CONNECTED',
          api: 'HEALTHY'
        },
        queueMetrics: queueStats,
        version: process.env.npm_package_version || '1.0.0'
      };
    } catch (err) {
      return {
        status: 'DOWN',
        error: err.message
      };
    }
  }
}
