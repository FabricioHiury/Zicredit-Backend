import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginRequestBody {
  @IsNotEmpty({ message: 'precisa do cpf' })
  cpf: string;
  @IsString()
  password: string;
}
