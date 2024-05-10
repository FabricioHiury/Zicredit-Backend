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
import { InvestmentModule } from './investment/investment.module';
import { ProjectModule } from './project/project.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    DatabaseModule,
    UserModule,
    AuthModule,
    MailModule,
    ControlRolesModule,
    CompanyModule,
    InvestmentModule,
    ProjectModule,
    MailModule,
  ],
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
