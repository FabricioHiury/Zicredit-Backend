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
      cpf: user.cpf,
      id: user.id.toString(),
    };

    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }

  async validateUser(cpf: string, password: string): Promise<User> {
    const user = await this.userService.findByCpf(cpf);

    if (user && !user.deletedAt) {
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (isPasswordValid) {
        return {
          ...user,
          id: user.id,
          password: undefined,
        };
      }
    }

    throw new UnauthorizedError('username or password provided is incorrect.');
  }
}
