import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UnauthorizedError } from '../errors/unauthorized.error';
import { User } from 'src/user/entities/user.entity';
import { UserService } from 'src/user/services/user.service';
import { UserPayload } from '../models/UserPayload';
import { UserToken } from '../models/UserToken';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  async login(user: any): Promise<UserToken> {
    const payload: UserPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      identifier: user.cpf || user.cnpj,
      id: user.id.toString(),
      company: user.company
        ? {
            id: user.company.id,
            name: user.company.name,
            cnpj: user.company.cnpj,
            address: user.company.address,
            phone: user.company.phone,
            email: user.company.email,
            bankDetails: user.company.bankDetails,
          }
        : null,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }

  async validateUser(identifier: string, password: string): Promise<User> {
    const user = await this.userService.findByIdentifier(identifier);

    if (user && !user.deleted_at) {
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (isPasswordValid) {
        return {
          ...user,
          id: user.id,
          password: undefined,
        };
      }
    }

    throw new UnauthorizedError('cpf/cnpj or password provided is incorrect.');
  }
}
