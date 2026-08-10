import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto, UpdateCompanyStageDto, CreateStakeholderDto, AddCompanyNoteDto, SendDirectEmailDto } from './dto/company.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../../common/guards/workspace.guard';
import { CurrentWorkspace } from '../../common/decorators/current-workspace.decorator';

@Controller('companies')
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  async createCompany(@CurrentWorkspace() workspaceId: string, @Body() dto: CreateCompanyDto) {
    return this.companiesService.createCompany(workspaceId, dto);
  }

  @Get()
  async findAll(
    @CurrentWorkspace() workspaceId: string,
    @Query('dealStage') dealStage?: string,
    @Query('search') search?: string,
  ) {
    return this.companiesService.findAll(workspaceId, { dealStage, search });
  }

  @Get(':id')
  async findOne(@CurrentWorkspace() workspaceId: string, @Param('id') id: string) {
    return this.companiesService.findOne(workspaceId, id);
  }

  @Patch(':id/stage')
  async updateStage(
    @CurrentWorkspace() workspaceId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCompanyStageDto,
  ) {
    return this.companiesService.updateStage(workspaceId, id, dto);
  }

  @Post(':id/stakeholders')
  async addStakeholder(
    @CurrentWorkspace() workspaceId: string,
    @Param('id') id: string,
    @Body() dto: CreateStakeholderDto,
  ) {
    return this.companiesService.addStakeholder(workspaceId, id, dto);
  }

  @Post(':id/notes')
  async addNote(
    @CurrentWorkspace() workspaceId: string,
    @Param('id') id: string,
    @Body() dto: AddCompanyNoteDto,
  ) {
    return this.companiesService.addNote(workspaceId, id, dto);
  }

  @Post('stakeholders/:stakeholderId/send-direct')
  async sendDirectEmail(
    @CurrentWorkspace() workspaceId: string,
    @Param('stakeholderId') stakeholderId: string,
    @Body() dto: SendDirectEmailDto,
  ) {
    return this.companiesService.sendDirectEmail(workspaceId, stakeholderId, dto);
  }
}
