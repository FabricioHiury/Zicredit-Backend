import { IsNotEmpty, IsString, ValidateIf } from 'class-validator';

export class LoginRequestBody {
  @IsNotEmpty({ message: 'CPF/CNPJ é obrigatório' })
  @IsString()
  identifier: string; 

  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @IsString()
  password: string;
}
