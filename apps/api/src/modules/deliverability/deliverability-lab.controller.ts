
import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { DeliverabilityLabService } from './deliverability-lab.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../../common/guards/workspace.guard';
import { CurrentWorkspace } from '../../common/decorators/current-workspace.decorator';

@Controller('deliverability-lab')
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class DeliverabilityLabController {
  constructor(private readonly labService: DeliverabilityLabService) {}

  @Get('history')
  async getHistory(@CurrentWorkspace() workspaceId: string) {
    return this.labService.getHistory(workspaceId);
  }

  @Post('test')
  async runTest(
    @CurrentWorkspace() workspaceId: string,
    @Body('inboxId') inboxId: string,
    @Body('subject') subject: string,
    @Body('body') body: string
  ) {
    return this.labService.runTest(workspaceId, inboxId, subject, body);
  }

  @Get('test/:id')
  async getTestResults(
    @CurrentWorkspace() workspaceId: string,
    @Param('id') id: string
  ) {
    return this.labService.getTest(workspaceId, id);
  }
}
