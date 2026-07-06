
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../../common/guards/workspace.guard';
import { CurrentWorkspace } from '../../common/decorators/current-workspace.decorator';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  async findAll(
    @CurrentWorkspace() workspaceId: string,
    @Query('entityType') entityType?: string,
    @Query('userId') userId?: string,
  ) {
    return this.auditLogsService.findAll(workspaceId, { entityType, userId });
  }
}
