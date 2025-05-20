import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

export interface SendEmail {
  to: string;
  subject: string;
  template: string;
}

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}
  async sendMail<TContext>(context: TContext, data: SendEmail) {
    await this.mailerService.sendMail({
      ...data,
      context,
    });
  }
}
