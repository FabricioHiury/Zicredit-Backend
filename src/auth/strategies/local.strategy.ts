import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../services/auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ cpfField: 'cpf' });
  }

  validate(cpf: string, password: string) {
    return this.authService.validateUser(cpf, password);
  }
}
