
import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { InboxesService } from './inboxes.service';
import { CreateInboxDto, UpdateInboxSettingsDto } from './dto/inbox.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../../common/guards/workspace.guard';
import { CurrentWorkspace } from '../../common/decorators/current-workspace.decorator';

@Controller('inboxes')
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class InboxesController {
  constructor(private readonly inboxesService: InboxesService) { }

  @Post()
  async create(
    @CurrentWorkspace() workspaceId: string,
    @Body() dto: CreateInboxDto
  ) {
    return this.inboxesService.create(workspaceId, dto);
  }

  @Get()
  async findAll(
    @CurrentWorkspace() workspaceId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
  ) {
    return this.inboxesService.findAll(workspaceId, Number(page), Number(limit), search);
  }

  @Get(':id')
  async findOne(
    @CurrentWorkspace() workspaceId: string,
    @Param('id') id: string
  ) {
    return this.inboxesService.findOne(workspaceId, id);
  }

  @Put(':id/settings')
  async updateSettings(
    @CurrentWorkspace() workspaceId: string,
    @Param('id') id: string,
    @Body() dto: UpdateInboxSettingsDto
  ) {
    return this.inboxesService.updateSettings(workspaceId, id, dto);
  }

  @Post('/bulk')
  async bulkUpdate(
    @CurrentWorkspace() workspaceId: string,
    @Body() dto: any // using any temporarily to avoid import sync issues in this call
  ) {
    return this.inboxesService.bulkUpdate(workspaceId, dto);
  }

  @Post(':id/check-health')
  async checkHealth(
    @CurrentWorkspace() workspaceId: string,
    @Param('id') id: string
  ) {
    return this.inboxesService.checkHealth(workspaceId, id);
  }

  @Delete(':id')
  async remove(
    @CurrentWorkspace() workspaceId: string,
    @Param('id') id: string
  ) {
    return this.inboxesService.remove(workspaceId, id);
  }

  @Post(':id/send-test')
  async sendTestEmail(
    @CurrentWorkspace() workspaceId: string,
    @Param('id') id: string,
    @Body() body: { to: string; subject: string; body: string }
  ) {
    return this.inboxesService.sendTestEmail(workspaceId, id, body.to, body.subject, body.body);
  }
}
