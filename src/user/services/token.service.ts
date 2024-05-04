import { Injectable } from '@nestjs/common';
import { Token } from '../entities/token.entity';
import * as jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import { add } from 'date-fns';

@Injectable()
export class TokenService {
  private secretKey = process.env.JWT_SECRET;

  generateToken(userId: string): string {
    const token = jwt.sign(
      {
        id: uuid(),
        userId,
        expiresAt: add(new Date(), {
          hours: +process.env.APP_EXPIRES_TO_RECOVER_PASSWORD,
        }),
      },
      this.secretKey,
      { expiresIn: '2h' },
    );

    return token;
  }

  verifyToken(token: string): any {
    try {
      const decoded = jwt.verify(token, this.secretKey);
      return decoded;
    } catch (error) {
      throw new Error('Token inválido');
    }
  }
}
