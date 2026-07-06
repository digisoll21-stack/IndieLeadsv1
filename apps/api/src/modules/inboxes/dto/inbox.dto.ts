import { IsEmail, IsEnum, IsObject, IsString, IsNumber, IsOptional, Min, Max, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum InboxProvider {
  GOOGLE = 'google',
  OUTLOOK = 'outlook',
  SMTP = 'smtp',
}

export class ProtocolCredentialsDto {
  @IsString()
  @IsOptional()
  smtpHost?: string;

  @IsNumber()
  @IsOptional()
  smtpPort?: number;

  @IsString()
  @IsOptional()
  smtpUser?: string;

  @IsString()
  @IsOptional()
  smtpPass?: string;

  @IsString()
  @IsOptional()
  imapHost?: string;

  @IsNumber()
  @IsOptional()
  imapPort?: number;

  @IsString()
  @IsOptional()
  imapUser?: string;

  @IsString()
  @IsOptional()
  imapPass?: string;

  @IsString()
  @IsOptional()
  accessToken?: string;

  @IsString()
  @IsOptional()
  refreshToken?: string;

  @IsNumber()
  @IsOptional()
  expiresAt?: number;
}

export class CreateInboxDto {
  @IsEmail()
  email: string;

  @IsEnum(InboxProvider)
  provider: InboxProvider;

  @IsObject()
  @ValidateNested()
  @Type(() => ProtocolCredentialsDto)
  credentials: ProtocolCredentialsDto;

  @IsOptional()
  @IsString()
  fromName?: string;
}

export class UpdateInboxSettingsDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(2000)
  dailyLimit?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(200)
  hourlyLimit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minDelaySeconds?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDelaySeconds?: number;

  @IsOptional()
  @IsBoolean()
  warmupEnabled?: boolean;

  @IsOptional()
  @IsString()
  signature?: string;

  @IsOptional()
  @IsEnum(['active', 'paused', 'disconnected'])
  status?: string;
}

export class BulkUpdateInboxDto extends UpdateInboxSettingsDto {
  @IsString({ each: true })
  inboxIds: string[];
}