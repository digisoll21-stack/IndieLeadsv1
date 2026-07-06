
import { Controller, Get, Post, Body, Param, Query, UseGuards, Delete } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { CreateLeadDto, ImportLeadsDto, UpdateLeadStatusDto, BulkLeadActionDto } from './dto/lead.dto';
import { LeadStatus } from '@shared/types';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../../common/guards/workspace.guard';
import { CurrentWorkspace } from '../../common/decorators/current-workspace.decorator';

@Controller('leads')
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) { }

  @Get()
  async findAll(
    @CurrentWorkspace() workspaceId: string,
    @Query('status') status?: string,
    @Query('search') search?: string
  ) {
    return this.leadsService.findAll(workspaceId, { status, search });
  }

  @Post()
  async create(@CurrentWorkspace() workspaceId: string, @Body() dto: CreateLeadDto) {
    return this.leadsService.create(workspaceId, dto);
  }

  @Post('import')
  async import(@CurrentWorkspace() workspaceId: string, @Body() dto: ImportLeadsDto) {
    return this.leadsService.importLeads(workspaceId, dto);
  }

  @Get(':id')
  async findOne(@CurrentWorkspace() workspaceId: string, @Param('id') id: string) {
    return this.leadsService.findOne(workspaceId, id);
  }

  @Get(':id/timeline')
  async getTimeline(@CurrentWorkspace() workspaceId: string, @Param('id') id: string) {
    return this.leadsService.getTimeline(workspaceId, id);
  }

  @Post(':id/status')
  async updateStatus(
    @CurrentWorkspace() workspaceId: string,
    @Param('id') id: string,
    @Body() dto: UpdateLeadStatusDto
  ) {
    return this.leadsService.updateStatus(workspaceId, id, dto.status);
  }

  @Post('bulk-status')
  async bulkUpdateStatus(
    @CurrentWorkspace() workspaceId: string,
    @Body() dto: { ids: string[]; status: LeadStatus }
  ) {
    return this.leadsService.bulkUpdateStatus(workspaceId, dto.ids, dto.status);
  }

  @Post('bulk-delete')
  async bulkRemove(@CurrentWorkspace() workspaceId: string, @Body() dto: { ids: string[] }) {
    return this.leadsService.bulkRemove(workspaceId, dto.ids);
  }

  @Delete(':id')
  async remove(@CurrentWorkspace() workspaceId: string, @Param('id') id: string) {
    return this.leadsService.remove(workspaceId, id);
  }
}
