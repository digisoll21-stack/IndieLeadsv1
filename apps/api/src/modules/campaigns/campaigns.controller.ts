
import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Query } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto, UpdateCampaignDto, UpdateSequenceDto } from './dto/campaign.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../../common/guards/workspace.guard';
import { CurrentWorkspace } from '../../common/decorators/current-workspace.decorator';

@Controller('campaigns')
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) { }

  @Post()
  async create(@CurrentWorkspace() workspaceId: string, @Body() dto: CreateCampaignDto) {
    return this.campaignsService.create(workspaceId, dto);
  }

  @Get()
  async findAll(
    @CurrentWorkspace() workspaceId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.campaignsService.findAll(workspaceId, Number(page), Number(limit), search, status);
  }

  @Get(':id')
  async findOne(@CurrentWorkspace() workspaceId: string, @Param('id') id: string) {
    return this.campaignsService.findOne(workspaceId, id);
  }

  @Put(':id')
  async update(
    @CurrentWorkspace() workspaceId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCampaignDto
  ) {
    return this.campaignsService.update(workspaceId, id, dto);
  }

  @Put(':id/sequence')
  async updateSequence(
    @CurrentWorkspace() workspaceId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSequenceDto
  ) {
    return this.campaignsService.updateSequence(workspaceId, id, dto.steps);
  }

  @Post(':id/sequence')
  async updateSequencePost(
    @CurrentWorkspace() workspaceId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSequenceDto
  ) {
    return this.campaignsService.updateSequence(workspaceId, id, dto.steps);
  }

  @Delete(':id')
  async remove(@CurrentWorkspace() workspaceId: string, @Param('id') id: string) {
    return this.campaignsService.remove(workspaceId, id);
  }
}
