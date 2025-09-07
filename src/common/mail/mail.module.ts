import { MailerModule } from '@nestjs-modules/mailer';
import { Global, Module } from '@nestjs/common';
import { join } from 'path';
import { ENTITIES_MESSAGE } from 'src/common/constants/entities.message';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { ConfigService } from '@nestjs/config';
import { MailService } from 'src/common/mail/mail.service';

@Global()
@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: async (config: ConfigService) => ({
        transport: {
          host: config.get(ENTITIES_MESSAGE.MAIL_HOST),
          secure: false,
          auth: {
            user: config.get(ENTITIES_MESSAGE.MAIL_NAME),
            pass: config.get(ENTITIES_MESSAGE.MAIL_PASS),
          },
        },
        defaults: {
          from: `"CNTT-VNUA" <${config.get(ENTITIES_MESSAGE.MAIL_FROM)}>`,
        },
        template: {
          dir: join(__dirname, 'templates'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
