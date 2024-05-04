import {
  IsEmail,
  IsNotEmpty,
  IsPhoneNumber,
  IsStrongPassword,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ description: 'Nome do usuário' })
  @IsNotEmpty({ message: 'Deve conter nome' })
  name: string;

  @ApiProperty({ description: 'Cpf do usuário' })
  @IsNotEmpty({ message: 'Deve conter cpf' })
  @MinLength(11)
  cpf: string;

  @ApiProperty({ description: 'Email do usuário' })
  @IsNotEmpty({ message: 'Deve conter email' })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Senha do usuário, deve conter pelo menos 8 caracteres',
  })
  @IsNotEmpty({ message: 'Deve conter senha' })
  @MinLength(8)
  password: string;

  @ApiProperty({ description: 'Telefone do usuário' })
  @IsNotEmpty({ message: 'Deve conter phone' })
  @IsPhoneNumber('BR')
  phone: string;

  @ApiProperty({ description: 'Cargo do usuário', example: 'INVESTOR' })
  @IsNotEmpty({ message: 'O usuário deve ter uma cargo' })
  role?: 'ZICREDIT' | 'SELLER' | 'COMPANY' | 'INVESTOR';
}
