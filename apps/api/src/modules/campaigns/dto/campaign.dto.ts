
import { IsString, IsEnum, IsOptional, IsBoolean, IsNumber, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { CampaignStatus } from '@shared/types';

class SequenceStepDto {
  @IsString()
  subject: string;

  @IsString()
  body: string;

  @IsNumber()
  @Min(0)
  delayDays: number;
}

export class CreateCampaignDto {
  @IsString()
  name: string;
}

export class UpdateCampaignDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(CampaignStatus)
  status?: CampaignStatus;

  @IsOptional()
  settings?: any;
}

export class UpdateSequenceDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SequenceStepDto)
  steps: SequenceStepDto[];
}
