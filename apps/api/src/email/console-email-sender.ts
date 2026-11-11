import { Logger } from '@nestjs/common';
import { EmailSender } from './email-sender.js';

// Development only: prints the code in the server log instead of sending an email.
// validateEnv refuses to start in production with this sender.
export class ConsoleEmailSender extends EmailSender {
  private readonly logger = new Logger('ConsoleEmailSender');

  sendLoginCode(to: string, code: string): Promise<void> {
    this.logger.warn(`DEV ONLY: sign-in code for ${to} is ${code}`);
    return Promise.resolve();
  }
}
