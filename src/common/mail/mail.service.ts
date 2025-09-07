import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import configuration from '../../configs/load.env';
import { UserAccount } from 'src/modules/users/entities/user_account.entity';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendEmail(user_account: UserAccount, token: string) {
    // const client_url = this.configService.get(ENTITIES_MESSAGE.CLIENT_URL);
    const client_url = configuration().client_url || '';
    const url = `${client_url}/resetPassword/${token}`;

    await this.mailerService.sendMail({
      to: user_account.email,
      // from: '"Support Team" <support@example.com>', // override default from
      subject: 'Hãy xác nhận email!',
      template: './forgotPassword', // `.hbs` extension is appended automatically
      context: {
        name: user_account.contact.fullname,
        url,
      },
    });
  }
}
