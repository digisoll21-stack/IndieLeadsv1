
import { Controller, Get, Post, Param, UseGuards, Query } from '@nestjs/common';
import { DomainsService } from './domains.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../../common/guards/workspace.guard';
import { CurrentWorkspace } from '../../common/decorators/current-workspace.decorator';

@Controller('domains')
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class DomainsController {
  constructor(private readonly domainsService: DomainsService) {}

  @Get()
  async findAll(@CurrentWorkspace() workspaceId: string) {
    return this.domainsService.findAll(workspaceId);
  }

  @Post(':id/verify')
  async verifyDNS(
    @CurrentWorkspace() workspaceId: string,
    @Param('id') id: string
  ) {
    return this.domainsService.verifyDNS(workspaceId, id);
  }
}
