import { describe, expect, it } from 'vitest';
import { BrevoEmailSender } from './brevo-email-sender.js';

const options = { apiKey: 'secret-api-key', fromAddress: 'no-reply@example.com', fromName: 'EduLink' };

describe('BrevoEmailSender', () => {
  it('posts the message to Brevo with the key in a header', async () => {
    let seenUrl = '';
    let seenInit: RequestInit | undefined;
    const fakeFetch = ((url: string, init?: RequestInit) => {
      seenUrl = url;
      seenInit = init;
      return Promise.resolve(new Response('{}', { status: 201 }));
    }) as unknown as typeof fetch;

    await new BrevoEmailSender(options, fakeFetch).sendLoginCode('ada@example.com', '123456');

    expect(seenUrl).toBe('https://api.brevo.com/v3/smtp/email');
    const headers = seenInit?.headers as Record<string, string>;
    expect(headers['api-key']).toBe('secret-api-key');
    const rawBody = typeof seenInit?.body === 'string' ? seenInit.body : '';
    const body = JSON.parse(rawBody) as {
      to: { email: string }[];
      textContent: string;
      subject: string;
    };
    expect(body.to[0]?.email).toBe('ada@example.com');
    expect(body.textContent).toContain('123456');
    expect(body.subject).not.toContain('123456');
  });

  it('throws a safe error when the provider refuses', async () => {
    const fakeFetch = (() =>
      Promise.resolve(new Response('{"message":"bad key secret-api-key"}', { status: 401 }))) as unknown as typeof fetch;
    let message = '';
    try {
      await new BrevoEmailSender(options, fakeFetch).sendLoginCode('ada@example.com', '654321');
    } catch (error) {
      message = error instanceof Error ? error.message : '';
    }
    expect(message).toContain('401');
    expect(message).not.toContain('secret-api-key');
    expect(message).not.toContain('654321');
  });
});
