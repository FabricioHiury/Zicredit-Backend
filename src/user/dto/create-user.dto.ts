import {
  IsEmail,
  IsNotEmpty,
  IsPhoneNumber,
  IsStrongPassword,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ description: 'Nome do usuário' })
  @IsNotEmpty({ message: 'Deve conter nome' })
  name: string;

  @ApiProperty({ description: 'Cpf do usuário' })
  @IsNotEmpty({ message: 'Deve conter cpf' })
  cpf: string;

  @ApiProperty({ description: 'Email do usuário' })
  @IsNotEmpty({ message: 'Deve conter email' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Senha do usuário' })
  @IsNotEmpty({ message: 'Deve conter senha' })
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minNumbers: 1,
    minUppercase: 1,
    minSymbols: 1,
  })
  password: string;

  @ApiProperty({ description: 'Telefone do usuário' })
  @IsNotEmpty({ message: 'Deve conter phone' })
  @IsPhoneNumber()
  phone: string;

  @ApiProperty({ description: 'Cargo do usuário', example: 'RESIDENT' })
  @IsNotEmpty({ message: 'O usuário deve ter uma cargo' })
  role?: 'OWNER' | 'ADMIN' | 'SYNDIC' | 'CONCIERGE' | 'RESIDENT';
}
