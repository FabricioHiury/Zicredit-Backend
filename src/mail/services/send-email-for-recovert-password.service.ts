import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserService } from 'src/user/services/user.service';
import { MailService } from './mail.service';
import { AuthService } from 'src/auth/services/auth.service';
import { TokenService } from 'src/user/services/token.service';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class RecoveryService {
  constructor(
    private readonly userService: UserService,
    private readonly authentication: AuthService,
    private readonly mailService: MailService,
    private readonly tokenService: TokenService,
  ) {}

  async requestPasswordReset(email: string): Promise<void> {
    try {
      const user = await this.userService.findByEmail(email);

      if (!user) {
        throw new NotFoundException('Usuário não encontrado');
      }

      const token = this.tokenService.generateToken(user.id);

      await this.mailService.sendMail<{ url: string; name: string }>(
        {
          url: `${process.env.APP_FRONTEND_URL_PASSWORD}/reset?token=${token}`,
          name: user.name,
        },
        {
          subject: 'Recuperação de senha',
          template: 'reset-password',
          to: user.email,
        },
      );
    } catch (error) {
      throw new BadRequestException(
        'Ocorreu um erro ao tentar enviar o email, tente novamente mais tarde.',
        error,
      );
    }
  }
}
