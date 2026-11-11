import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BrevoEmailSender } from './brevo-email-sender.js';
import { ConsoleEmailSender } from './console-email-sender.js';
import { EmailSender } from './email-sender.js';

@Module({
  providers: [
    {
      provide: EmailSender,
      inject: [ConfigService],
      useFactory: (config: ConfigService): EmailSender => {
        if (config.get<string>('EMAIL_PROVIDER') === 'brevo') {
          return new BrevoEmailSender({
            apiKey: config.getOrThrow<string>('BREVO_API_KEY'),
            fromAddress: config.getOrThrow<string>('EMAIL_FROM_ADDRESS'),
            fromName: config.getOrThrow<string>('EMAIL_FROM_NAME'),
          });
        }
        return new ConsoleEmailSender();
      },
    },
  ],
  exports: [EmailSender],
})
export class EmailModule {}
