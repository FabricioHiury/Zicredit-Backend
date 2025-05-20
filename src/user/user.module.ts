import { Module } from '@nestjs/common';
import { UserService } from './services/user.service';
import { UserController } from './controllers/user.controller';
import { DatabaseModule } from 'src/database/database.module';
import { MailerModule, MailerService } from '@nestjs-modules/mailer';
import { TokenService } from './services/token.service';
import { AuthService } from 'src/auth/services/auth.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/database/prisma.service';
import { PaginationModule } from 'src/pagination/pagination.module';
import { MailService } from 'src/mail/services/mail.service';
import { RecoveryService } from 'src/mail/services/send-email-for-recovert-password.service';

@Module({
  controllers: [UserController],
  providers: [
    UserService,
    PrismaService,
    AuthService,
    MailService,
    RecoveryService,
    TokenService,
    JwtService,
  ],
  imports: [DatabaseModule, MailerModule, PaginationModule],
  exports: [UserService],
})
export class UserModule {}
