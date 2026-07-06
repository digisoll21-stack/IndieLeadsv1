
import { Controller, Get, Post, Param, UseGuards, Put, Delete, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../../common/guards/workspace.guard';
import { CurrentWorkspace } from '../../common/decorators/current-workspace.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async findAll(
    @CurrentWorkspace() workspaceId: string,
    @Query('unreadOnly') unreadOnly?: boolean,
  ) {
    return this.notificationsService.findAll(workspaceId, unreadOnly);
  }

  @Put(':id/read')
  async markAsRead(
    @CurrentWorkspace() workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.notificationsService.markAsRead(workspaceId, id);
  }

  @Post('read-all')
  async markAllRead(@CurrentWorkspace() workspaceId: string) {
    return this.notificationsService.markAllRead(workspaceId);
  }

  @Delete(':id')
  async remove(
    @CurrentWorkspace() workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.notificationsService.remove(workspaceId, id);
  }
}
