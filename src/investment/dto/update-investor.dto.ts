import { Type } from 'class-transformer';
import {
  IsUUID,
  IsOptional,
  IsString,
  IsPhoneNumber,
  IsEmail,
  ValidateNested,
  Min,
  MinLength,
  IsNotEmpty,
} from 'class-validator';

class UpdateInvestmentDto {
  @IsUUID(4, { message: 'O ID do investimento deve ser um UUID válido' })
  @IsNotEmpty({ message: 'O ID do investimento é obrigatório' })
  investmentId: string;

  @IsOptional()
  @Min(0, {
    message:
      'O valor investido deve ser zero para remover o investimento ou maior que zero para adicionar',
  })
  amountInvested?: number;
}

export class UpdateInvestorDto {
  @IsOptional()
  @IsString({ message: 'O nome deve ser uma string' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'CPF deve ser uma string' })
  @MinLength(11, { message: 'CPF deve ter pelo menos 11 caracteres' })
  cpf?: string;

  @IsOptional()
  @IsPhoneNumber('BR', { message: 'Telefone deve ser um número válido' })
  phone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email deve ser um endereço de email válido' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'Senha deve ter pelo menos 8 caracteres' })
  password?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateInvestmentDto)
  investment?: UpdateInvestmentDto;
}
