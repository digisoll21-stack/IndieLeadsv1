
import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { BouncesService } from './bounces.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../../common/guards/workspace.guard';
import { CurrentWorkspace } from '../../common/decorators/current-workspace.decorator';

@Controller('bounces')
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class BouncesController {
  constructor(private readonly bouncesService: BouncesService) { }

  /**
   * GET /bounces/stats — aggregate bounce stats for the workspace (30d)
   */
  @Get('stats')
  async getStats(@CurrentWorkspace() workspaceId: string) {
    return this.bouncesService.getBounceStats(workspaceId);
  }

  /**
   * GET /bounces — recent bounce history for the workspace
   */
  @Get()
  async getHistory(
    @CurrentWorkspace() workspaceId: string,
    @Query('limit') limit?: string,
  ) {
    return this.bouncesService.getBounceHistory(workspaceId, limit ? parseInt(limit) : 50);
  }

  /**
   * POST /bounces/webhook — ingest a bounce from provider (SES, Postmark, etc.)
   * No auth guard — provider webhooks don't carry JWT tokens
   */
  @Post('webhook')
  @UseGuards() // Explicitly clear workspace guard for webhook
  async handleProviderWebhook(@Body() payload: any) {
    return this.bouncesService.processBounceEvent({
      logId: payload.metadata?.logId || payload.logId,
      type: payload.bounceType === 'Permanent' ? 'hard' : payload.bounceType === 'Complaint' ? 'spam' : 'soft',
      rawReason: payload.reason || payload.diagnosticCode || 'Provider bounce',
    });
  }

  /**
   * POST /bounces/test — trigger a manual test bounce (dev/debug only)
   */
  @Post('test')
  async testBounce(
    @CurrentWorkspace() workspaceId: string,
    @Body() data: { logId: string; type: 'hard' | 'soft' | 'spam' }
  ) {
    return this.bouncesService.processBounceEvent({
      logId: data.logId,
      type: data.type,
      rawReason: 'Manual test bounce',
    });
  }
}
