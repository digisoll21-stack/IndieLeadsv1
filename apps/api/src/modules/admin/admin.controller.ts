import { Controller, Get, Post, Param, UseGuards, Body, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { QueuesService } from '../queues/queues.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
    constructor(
        private readonly prisma: PrismaService,
        private readonly queuesService: QueuesService
    ) { }

    @Get('users')
    async getUsers() {
        return this.prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                isBanned: true,
                createdAt: true,
                _count: {
                    select: { memberships: true }
                }
            }
        });
    }

    @Post('users/:id/ban')
    async toggleBan(@Param('id') id: string) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) throw new NotFoundException('User not found');

        // Prevent banning other admins for safety
        if (user.role === 'SUPER_ADMIN') {
            throw new ForbiddenException('Cannot ban a Super Admin');
        }

        return this.prisma.user.update({
            where: { id },
            data: { isBanned: !user.isBanned }
        });
    }

    @Get('campaigns')
    async getCampaigns() {
        return this.prisma.campaign.findMany({
            where: { status: { not: 'draft' } },
            orderBy: { createdAt: 'desc' },
            include: {
                workspace: {
                    select: { name: true }
                },
                _count: {
                    select: { leads: true }
                }
            },
            take: 100 // Limit for performance
        });
    }

    @Post('campaigns/:id/pause')
    async forcePauseCampaign(@Param('id') id: string) {
        return this.prisma.campaign.update({
            where: { id },
            data: { status: 'PAUSED' }
        });
    }

    @Get('system-health')
    async getSystemHealth() {
        const queueStats = await this.queuesService.getQueueStatus();

        // Aggregate DB stats
        const totalUsers = await this.prisma.user.count();
        const totalSent = await this.prisma.sendingLog.count({
            where: { status: 'sent' }
        });

        return {
            queues: queueStats,
            database: {
                users: totalUsers,
                emailsSent: totalSent
            }
        };
    }
}
