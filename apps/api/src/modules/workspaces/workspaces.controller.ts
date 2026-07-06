import { Controller, Get, Post, Body, UseGuards, Param } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { SubscriptionService } from './subscription.service';
import { CreateWorkspaceDto } from './dto/workspace.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspacesController {
  constructor(
    private readonly workspacesService: WorkspacesService,
    private readonly subscriptionService: SubscriptionService
  ) { }

  @Post()
  async create(@Body() dto: CreateWorkspaceDto, @CurrentUser() user: any) {
    return this.workspacesService.create(dto, user.id);
  }

  @Get()
  async findAll(@CurrentUser() user: any) {
    return this.workspacesService.findByUser(user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.workspacesService.findByIdForUser(id, user.id);
  }

  @Get(':id/members')
  async findMembers(@Param('id') id: string, @CurrentUser() user: any) {
    return this.workspacesService.findMembers(id, user.id);
  }

  @Post(':id/billing/checkout')
  async createCheckout(@Param('id') id: string, @Body('plan') plan: string, @CurrentUser() user: any) {
    await this.workspacesService.findByIdForUser(id, user.id); // Guard
    return this.subscriptionService.createCheckoutSession(id, plan);
  }

  @Post(':id') // Using Post for compatibility or Patch
  async update(@Param('id') id: string, @Body() data: any, @CurrentUser() user: any) {
    await this.workspacesService.findByIdForUser(id, user.id); // Guard
    return this.workspacesService.update(id, data);
  }
}