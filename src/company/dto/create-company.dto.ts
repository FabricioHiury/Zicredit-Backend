import { IsEmail, IsNotEmpty, IsOptional, IsPhoneNumber, IsString, MinLength } from 'class-validator';

export class CreateCompanyDto {
  @IsNotEmpty({ message: 'O nome da empresa é obrigatório' })
  @IsString({ message: 'O nome deve ser uma string' })
  name: string;

  @IsNotEmpty({ message: 'O CNPJ é obrigatório' })
  @IsString({ message: 'O CNPJ deve ser uma string' })
  @MinLength(14)
  cnpj: string;

  @IsNotEmpty({ message: 'O endereço é obrigatório' })
  @IsString({ message: 'O endereço deve ser uma string' })
  address: string;

  @IsNotEmpty({ message: 'O telefone é obrigatório' })
  @IsString({ message: 'O telefone deve ser uma string' })
  phone: string;

  @IsEmail({}, { message: 'O email deve ser um endereço de email válido' })
  @IsOptional()
  email?: string;

  @IsNotEmpty({ message: 'Nome do usuário é obrigatório' })
  userName: string;

  @IsEmail({}, { message: 'Email do usuário é obrigatório' })
  userEmail: string;

  @IsNotEmpty({ message: 'Senha do usuário é obrigatória' })
  @MinLength(8)
  userPassword: string;

  @IsNotEmpty({ message: 'CPF do usuário é obrigatório' })
  @MinLength(11)
  userCpf: string;

  @IsString({ message: 'Telefone do usuário deve ser uma string' })
  @IsPhoneNumber('BR')
  userPhone: string;
}
