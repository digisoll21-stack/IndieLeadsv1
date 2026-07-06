
import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../../common/guards/workspace.guard';
import { CurrentWorkspace } from '../../common/decorators/current-workspace.decorator';

@Controller('analytics')
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    /** GET /analytics/pulse — 7-day sent + reply trend */
    @Get('pulse')
    async getPulse(@CurrentWorkspace() workspaceId: string) {
        return this.analyticsService.getGlobalPulse(workspaceId);
    }

    /** GET /analytics/sentiment — 30-day reply sentiment breakdown */
    @Get('sentiment')
    async getSentiment(@CurrentWorkspace() workspaceId: string) {
        return this.analyticsService.getReplySentiment(workspaceId);
    }

    /** GET /analytics/campaigns — per-campaign performance table */
    @Get('campaigns')
    async getCampaigns(@CurrentWorkspace() workspaceId: string) {
        return this.analyticsService.getCampaignPerformanceTable(workspaceId);
    }

    /** GET /analytics/campaigns/:id — single campaign stats */
    @Get('campaigns/:id')
    async getCampaignStats(@Param('id') id: string) {
        return this.analyticsService.getCampaignStats(id);
    }
}
