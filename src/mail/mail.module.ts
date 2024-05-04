import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { MailService } from './services/mail.service';
// import { RecoveryService } from './services/send-email-for-recovert-password.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/database/prisma.service';
import { MailerModule, MailerService } from '@nestjs-modules/mailer';
import { UserService } from 'src/user/services/user.service';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { Token } from 'src/user/entities/token.entity';
import { AuthService } from 'src/auth/services/auth.service';
import { TokenService } from 'src/user/services/token.service';
// import { PaginationModule } from 'src/pagination/pagination.module';

@Module({
//   imports: [
//     DatabaseModule,
//     // PaginationModule,
//     // MailerModule.forRoot({
//     //   transport: {
//     //     host: process.env.APP_NODEMAILER_HOST,
//     //     port: process.env.APP_NODEMAILER_PORT,
//     //     auth: {
//     //       user: process.env.APP_NODEMAILER_MAIL,
//     //       pass: process.env.APP_NODEMAILER_PASSWORD,
//     //     },
//     //   },
//     //   defaults: {
//     //     from: "No Reply" <${process.env.APP_NODEMAILER_FROM}>,
//     //   },
//     //   template: {
//     //     dir: join(__dirname, 'templates'),
//     //     adapter: new HandlebarsAdapter(),
//     //   },
//     // }),
//   ],
//   providers: [
//     MailService,
//     // RecoveryService,
//     UserService,
//     AuthService,
//     TokenService,
//     JwtService,
//     PrismaService,
//     MailerService
//   ],
//   exports: [MailService],
})
export class MailModule {}
