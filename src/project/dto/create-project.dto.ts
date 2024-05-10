import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsUUID,
  IsOptional,
} from 'class-validator';

export class CreateProjectDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  location: string;

  @IsNotEmpty()
  @IsNumber()
  totalValue: number;

  @IsNotEmpty()
  @IsUUID()
  companyId: string;

  @IsOptional()
  @IsString()
  cover?: string;
}
