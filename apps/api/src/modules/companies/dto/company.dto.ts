import { IsString, IsOptional, IsNumber, IsEmail } from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  domain?: string;

  @IsString()
  @IsOptional()
  website?: string;

  @IsString()
  @IsOptional()
  industry?: string;

  @IsNumber()
  @IsOptional()
  employeeCount?: number;

  @IsString()
  @IsOptional()
  dealStage?: string;

  @IsNumber()
  @IsOptional()
  dealValue?: number;
}

export class UpdateCompanyStageDto {
  @IsString()
  dealStage: string;

  @IsNumber()
  @IsOptional()
  dealValue?: number;
}

export class CreateStakeholderDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  linkedinUrl?: string;
}

export class AddCompanyNoteDto {
  @IsString()
  content: string;

  @IsString()
  @IsOptional()
  authorName?: string;
}

export class SendDirectEmailDto {
  @IsString()
  inboxId: string;

  @IsString()
  subject: string;

  @IsString()
  body: string;
}
