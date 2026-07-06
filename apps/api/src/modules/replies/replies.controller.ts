
import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { RepliesService } from './replies.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../../common/guards/workspace.guard';
import { CurrentWorkspace } from '../../common/decorators/current-workspace.decorator';

@Controller('replies')
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class RepliesController {
  constructor(private readonly repliesService: RepliesService) { }

  @Get()
  async findAll(
    @CurrentWorkspace() workspaceId: string,
    @Query('campaignId') campaignId?: string
  ) {
    return this.repliesService.findAll(workspaceId, campaignId);
  }

  @Post(':id/send')
  async sendReply(
    @CurrentWorkspace() workspaceId: string,
    @Param('id') id: string,
    @Body('body') body: string
  ) {
    return this.repliesService.sendReply(workspaceId, id, body);
  }
}
