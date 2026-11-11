import { EmailSender } from './email-sender.js';

export interface BrevoOptions {
  apiKey: string;
  fromAddress: string;
  fromName: string;
}

const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';

export class BrevoEmailSender extends EmailSender {
  constructor(
    private readonly options: BrevoOptions,
    private readonly fetchFn: typeof fetch = fetch,
  ) {
    super();
  }

  async sendLoginCode(to: string, code: string): Promise<void> {
    const { apiKey, fromAddress, fromName } = this.options;
    const text =
      `Your ${fromName} sign-in code is ${code}.\n\n` +
      'It expires in 10 minutes. If you did not ask for it, you can ignore this email.\n' +
      `Never share this code with anyone. ${fromName} will never ask you for it.`;
    const html =
      `<p>Your ${fromName} sign-in code is:</p>` +
      `<p style="font-size:28px;font-weight:bold;letter-spacing:4px">${code}</p>` +
      '<p>It expires in 10 minutes. If you did not ask for it, you can ignore this email.</p>' +
      `<p>Never share this code with anyone. ${fromName} will never ask you for it.</p>`;

    const response = await this.fetchFn(BREVO_URL, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { name: fromName, email: fromAddress },
        to: [{ email: to }],
        subject: `Your ${fromName} sign-in code`,
        textContent: text,
        htmlContent: html,
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      // Status only: never put the API key, the code or the response body in an error.
      throw new Error(`Email provider rejected the message (status ${response.status})`);
    }
  }
}
