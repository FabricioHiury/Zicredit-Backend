import { IsOptional, IsString, IsNumber, IsUUID, IsArray } from 'class-validator';

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsNumber()
  totalValue?: number;

  @IsOptional()
  @IsUUID()
  companyId?: string;

  @IsOptional()
  @IsString()
  cover?: string;

  @IsOptional()
  @IsUUID(4, { message: 'O ID do vendedor deve ser um UUID válido' })
  @IsArray()
  sellerId?: string[];
}
