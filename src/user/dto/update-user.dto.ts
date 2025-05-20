import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsStrongPassword,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({ description: 'Nome do usuário' })
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'Cpf do usuário' })
  @IsOptional()
  @MinLength(11)
  cpf?: string;

  @ApiProperty({ description: 'Email do usuário' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: 'Senha do usuário, deve conter pelo menos 8 caracteres',
  })
  @IsOptional()
  @MinLength(8)
  password?: string;

  @ApiProperty({ description: 'Telefone do usuário' })
  @IsOptional()
  @IsPhoneNumber('BR')
  phone?: string;

  @ApiProperty({ description: 'Cargo do usuário', example: 'INVESTOR' })
  @IsOptional()
  role?: 'ZICREDIT' | 'SELLER' | 'COMPANY' | 'INVESTOR';
}
