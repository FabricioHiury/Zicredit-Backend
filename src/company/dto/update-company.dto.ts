import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MinLength,
} from 'class-validator';

export class UpdateCompanyDto {
  @IsOptional()
  @IsString({ message: 'O nome deve ser uma string' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'O CNPJ deve ser uma string' })
  @MinLength(14)
  cnpj?: string;

  @IsOptional()
  @IsString({ message: 'O endereço deve ser uma string' })
  address?: string;

  @IsOptional()
  @IsNotEmpty({ message: 'Os dados bancários são obrigatórios' })
  @IsString({ message: 'Os dados bancários devem ser uma string' })
  bankData: string;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsString({ message: 'O telefone deve ser uma string' })
  phone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'O email deve ser um endereço de email válido' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'Nome do usuário é obrigatório' })
  userName?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email do usuário é obrigatório' })
  userEmail?: string;

  @IsOptional()
  @IsString({ message: 'Senha do usuário é obrigatória' })
  @MinLength(8)
  userPassword?: string;

  @IsOptional()
  @IsString({ message: 'CPF do usuário é obrigatório' })
  @MinLength(11)
  userCpf?: string;

  @IsOptional()
  @IsPhoneNumber('BR', { message: 'Telefone do usuário deve ser uma string' })
  userPhone?: string;
}
