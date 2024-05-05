import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt.guard';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { ControlRolesModule } from './control-roles/control-roles.module';
import { CompanyModule } from './company/company.module';

@Module({
  imports: [UserModule, AuthModule, MailModule, ControlRolesModule, CompanyModule],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
