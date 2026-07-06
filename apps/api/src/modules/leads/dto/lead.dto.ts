
import { IsEmail, IsString, IsOptional, IsObject, IsArray, IsEnum, IsUUID } from 'class-validator';
import { LeadStatus } from '@shared/types';

export class CreateLeadDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsObject()
  customFields?: Record<string, string>;
}

export class ImportLeadsDto {
  @IsArray()
  @IsObject({ each: true })
  leads: CreateLeadDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  batchId?: string;

  @IsOptional()
  @IsUUID()
  campaignId?: string;
}

export class UpdateLeadStatusDto {
  @IsEnum(LeadStatus)
  status: LeadStatus;
}

export class BulkLeadActionDto {
  @IsArray()
  @IsString({ each: true })
  ids: string[];

  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;
}
