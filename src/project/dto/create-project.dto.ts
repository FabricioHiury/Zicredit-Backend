import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsUUID,
  IsOptional,
  IsArray,
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

  @IsOptional()
  @IsUUID(4, { message: 'O ID do vendedor deve ser um UUID válido' })
  @IsArray()
  sellerId?: string[];
}
