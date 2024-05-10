import { Type } from 'class-transformer';
import {
  IsUUID,
  IsNotEmpty,
  Min,
  IsOptional,
  IsString,
  MinLength,
  IsPhoneNumber,
  IsEmail,
  IsArray,
  ValidateNested,
} from 'class-validator';

class ProjectInvestmentDto {
  @IsUUID(4, { message: 'O ID do projeto deve ser um UUID válido' })
  @IsNotEmpty({ message: 'O ID do projeto é obrigatório' })
  projectId: string;

  @IsOptional()
  @Min(0.01, { message: 'O valor investido deve ser maior que zero' })
  amountInvested: number;

  @IsOptional()
  @IsUUID(4, { message: 'O ID do vendedor deve ser um UUID válido' })
  sellerId?: string;

  @IsNotEmpty({ message: 'Dados bancários são obrigatório' })
  @IsString()
  bankData: string;
}

export class CreateInvestorDto {
  @IsNotEmpty({ message: 'Nome completo é obrigatório' })
  @IsString({ message: 'O nome deve ser uma string' })
  name: string;

  @IsNotEmpty({ message: 'CPF é obrigatório' })
  @IsString({ message: 'CPF deve ser uma string' })
  @MinLength(11, { message: 'CPF deve ter pelo menos 11 caracteres' })
  cpf: string;

  @IsNotEmpty({ message: 'Telefone é obrigatório' })
  @IsPhoneNumber('BR', { message: 'Telefone deve ser um número válido' })
  phone: string;

  @IsEmail({}, { message: 'Email deve ser um endereço de email válido' })
  email: string;

  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @MinLength(8, { message: 'Senha deve ter pelo menos 8 caracteres' })
  password: string;

  @IsArray({ message: 'Os investimentos devem ser fornecidos como um array' })
  @ValidateNested({ each: true })
  @Type(() => ProjectInvestmentDto)
  investments: ProjectInvestmentDto[];
}
