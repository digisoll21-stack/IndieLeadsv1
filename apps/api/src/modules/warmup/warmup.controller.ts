
import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { WarmupService } from './warmup.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../../common/guards/workspace.guard';
import { CurrentWorkspace } from '../../common/decorators/current-workspace.decorator';

@Controller('warmup')
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class WarmupController {
  constructor(private readonly warmupService: WarmupService) {}

  @Get()
  async getWarmupPool(@CurrentWorkspace() workspaceId: string) {
    return this.warmupService.getPoolStats(workspaceId);
  }

  @Put(':inboxId/toggle')
  async toggleWarmup(
    @CurrentWorkspace() workspaceId: string,
    @Param('inboxId') inboxId: string,
    @Body('enabled') enabled: boolean
  ) {
    return this.warmupService.toggleWarmup(workspaceId, inboxId, enabled);
  }

  @Post('trigger-cycle')
  async triggerCycle() {
    // Admin/System only in production
    return this.warmupService.triggerWarmupCycle();
  }
}
