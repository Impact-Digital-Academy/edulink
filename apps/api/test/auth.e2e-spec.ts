import { randomUUID } from 'node:crypto';
import { type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { SignJWT } from 'jose';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { type VerifyResultDto } from '../src/auth/auth.service.js';
import { EmailSender } from '../src/email/email-sender.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

// Collects the codes the app "emails", so tests can read them.
class CapturingEmailSender extends EmailSender {
  readonly messages: { to: string; code: string }[] = [];

  sendLoginCode(to: string, code: string): Promise<void> {
    this.messages.push({ to, code });
    return Promise.resolve();
  }

  lastCodeFor(to: string): string {
    const message = [...this.messages].reverse().find((item) => item.to === to);
    if (!message) throw new Error(`No code was sent to ${to}`);
    return message.code;
  }
}

describe('Authentication (e2e, needs the database)', () => {
  const PREFIX = `e2e-${randomUUID().slice(0, 8)}-`;
  const sender = new CapturingEmailSender();
  let app: INestApplication;
  let prisma: PrismaService;
  let config: ConfigService;

  const http = () => request(app.getHttpServer());
  const newEmail = (label: string) => `${PREFIX}${label}-${randomUUID().slice(0, 6)}@example.test`;

  // Moves the cooldown out of the way so the same address can ask again.
  const ageCodes = (email: string) =>
    prisma.loginCode.updateMany({
      where: { email },
      data: { createdAt: new Date(Date.now() - 5 * 60 * 1000) },
    });

  async function signIn(email: string): Promise<VerifyResultDto> {
    await http().post('/v1/auth/request-code').send({ email }).expect(202);
    const code = sender.lastCodeFor(email.toLowerCase());
    const res = await http()
      .post('/v1/auth/verify-code')
      .send({ email, code, acceptTerms: true, deviceName: 'test phone' })
      .expect(200);
    return res.body as VerifyResultDto;
  }

  const wrongCodeFor = (code: string) => (code === '000000' ? '111111' : '000000');

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(EmailSender)
      .useValue(sender)
      .compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
    config = app.get(ConfigService);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { startsWith: PREFIX } } });
    await prisma.loginCode.deleteMany({ where: { email: { startsWith: PREFIX } } });
    await app.close();
  });

  describe('requesting a code', () => {
    it('rejects an invalid email address', async () => {
      await http().post('/v1/auth/request-code').send({ email: 'not-an-email' }).expect(400);
      await http().post('/v1/auth/request-code').send({}).expect(400);
    });

    it('rejects unexpected fields', async () => {
      await http()
        .post('/v1/auth/request-code')
        .send({ email: newEmail('extra'), isAdmin: true })
        .expect(400);
    });

    it('sends a code to the lower-cased address and never reveals it in the response', async () => {
      const email = newEmail('Case');
      const res = await http().post('/v1/auth/request-code').send({ email: email.toUpperCase() }).expect(202);
      const code = sender.lastCodeFor(email.toLowerCase());
      expect(code).toMatch(/^\d{6}$/);
      expect(JSON.stringify(res.body)).not.toContain(code);
    });

    it('stores only a hash of the code', async () => {
      const email = newEmail('hash');
      await http().post('/v1/auth/request-code').send({ email }).expect(202);
      const code = sender.lastCodeFor(email);
      const row = await prisma.loginCode.findFirstOrThrow({ where: { email } });
      expect(row.codeHash).not.toContain(code);
      expect(row.codeHash).toHaveLength(64);
    });

    it('makes a person wait between codes', async () => {
      const email = newEmail('cooldown');
      await http().post('/v1/auth/request-code').send({ email }).expect(202);
      const res = await http().post('/v1/auth/request-code').send({ email }).expect(429);
      expect(res.body.retryAfterSeconds).toBeGreaterThan(0);
    });

    it('limits how many codes one address can request in 15 minutes', async () => {
      const email = newEmail('flood');
      const now = Date.now();
      for (const minutesAgo of [6, 5, 4]) {
        await prisma.loginCode.create({
          data: {
            email,
            codeHash: 'x'.repeat(64),
            expiresAt: new Date(now + 60_000),
            createdAt: new Date(now - minutesAgo * 60_000),
          },
        });
      }
      await http().post('/v1/auth/request-code').send({ email }).expect(429);
    });
  });

  describe('verifying a code', () => {
    it('rejects a code that is not six digits', async () => {
      await http()
        .post('/v1/auth/verify-code')
        .send({ email: newEmail('format'), code: '12345' })
        .expect(400);
    });

    it('rejects a wrong code and an address that never asked for one', async () => {
      const email = newEmail('wrong');
      await http().post('/v1/auth/request-code').send({ email }).expect(202);
      const wrong = wrongCodeFor(sender.lastCodeFor(email));
      await http().post('/v1/auth/verify-code').send({ email, code: wrong, acceptTerms: true }).expect(401);
      await http()
        .post('/v1/auth/verify-code')
        .send({ email: newEmail('never'), code: '123456', acceptTerms: true })
        .expect(401);
    });

    it('burns the code after five wrong guesses', async () => {
      const email = newEmail('guesses');
      await http().post('/v1/auth/request-code').send({ email }).expect(202);
      const real = sender.lastCodeFor(email);
      const wrong = wrongCodeFor(real);
      for (let i = 0; i < 5; i += 1) {
        await http().post('/v1/auth/verify-code').send({ email, code: wrong, acceptTerms: true }).expect(401);
      }
      await http().post('/v1/auth/verify-code').send({ email, code: real, acceptTerms: true }).expect(401);
    });

    it('rejects an expired code', async () => {
      const email = newEmail('expired');
      await http().post('/v1/auth/request-code').send({ email }).expect(202);
      const code = sender.lastCodeFor(email);
      await prisma.loginCode.updateMany({ where: { email }, data: { expiresAt: new Date(Date.now() - 1000) } });
      await http().post('/v1/auth/verify-code').send({ email, code, acceptTerms: true }).expect(401);
    });

    it('accepts a code only once', async () => {
      const email = newEmail('once');
      await http().post('/v1/auth/request-code').send({ email }).expect(202);
      const code = sender.lastCodeFor(email);
      await http().post('/v1/auth/verify-code').send({ email, code, acceptTerms: true }).expect(200);
      await http().post('/v1/auth/verify-code').send({ email, code, acceptTerms: true }).expect(401);
    });

    it('asks a new person to accept the terms, keeps the code valid, and records consent', async () => {
      const email = newEmail('terms');
      await http().post('/v1/auth/request-code').send({ email }).expect(202);
      const code = sender.lastCodeFor(email);

      const refused = await http().post('/v1/auth/verify-code').send({ email, code }).expect(422);
      expect(refused.body.error).toBe('terms_required');

      const res = await http().post('/v1/auth/verify-code').send({ email, code, acceptTerms: true }).expect(200);
      const body = res.body as VerifyResultDto;
      expect(body.isNewUser).toBe(true);
      expect(body.user.email).toBe(email);

      const consents = await prisma.consentRecord.findMany({ where: { userId: body.user.id } });
      expect(consents).toHaveLength(1);
      expect(consents[0]?.document).toBe('terms_and_privacy');
    });

    it('lets a returning person in without accepting terms again', async () => {
      const email = newEmail('return');
      const first = await signIn(email);
      expect(first.isNewUser).toBe(true);
      await ageCodes(email);
      await http().post('/v1/auth/request-code').send({ email }).expect(202);
      const res = await http()
        .post('/v1/auth/verify-code')
        .send({ email, code: sender.lastCodeFor(email) })
        .expect(200);
      expect((res.body as VerifyResultDto).isNewUser).toBe(false);
      expect((res.body as VerifyResultDto).user.id).toBe(first.user.id);
    });

    it('does not let a suspended account sign in', async () => {
      const email = newEmail('suspended');
      const first = await signIn(email);
      await prisma.user.update({ where: { id: first.user.id }, data: { status: 'suspended' } });
      await ageCodes(email);
      await http().post('/v1/auth/request-code').send({ email }).expect(202);
      await http()
        .post('/v1/auth/verify-code')
        .send({ email, code: sender.lastCodeFor(email) })
        .expect(403);
    });
  });

  describe('signed-in requests', () => {
    it('requires a valid token', async () => {
      await http().get('/v1/me').expect(401);
      await http().get('/v1/me').set('Authorization', 'Bearer not-a-token').expect(401);
      await http().get('/v1/me').set('Authorization', 'Basic abc').expect(401);
    });

    it('returns only safe fields about the signed-in person', async () => {
      const email = newEmail('me');
      const session = await signIn(email);
      const res = await http().get('/v1/me').set('Authorization', `Bearer ${session.accessToken}`).expect(200);
      expect(res.body.email).toBe(email);
      expect(Object.keys(res.body).sort()).toEqual(['createdAt', 'email', 'emailVerifiedAt', 'id']);
    });

    it('rejects a token signed with the wrong secret', async () => {
      const session = await signIn(newEmail('forged'));
      const forged = await new SignJWT({ sid: 'whatever' })
        .setProtectedHeader({ alg: 'HS256' })
        .setSubject(session.user.id)
        .setIssuer('edulink-api')
        .setAudience('edulink-app')
        .setExpirationTime('10m')
        .sign(new TextEncoder().encode('x'.repeat(40)));
      await http().get('/v1/me').set('Authorization', `Bearer ${forged}`).expect(401);
    });

    it('rejects an expired token even when signed correctly', async () => {
      const session = await signIn(newEmail('expiredjwt'));
      const secret = new TextEncoder().encode(config.getOrThrow<string>('JWT_ACCESS_SECRET'));
      const sid = (await prisma.session.findFirstOrThrow({ where: { userId: session.user.id } })).id;
      const expired = await new SignJWT({ sid })
        .setProtectedHeader({ alg: 'HS256' })
        .setSubject(session.user.id)
        .setIssuer('edulink-api')
        .setAudience('edulink-app')
        .setExpirationTime(Math.floor(Date.now() / 1000) - 60)
        .sign(secret);
      await http().get('/v1/me').set('Authorization', `Bearer ${expired}`).expect(401);
    });

    it('rotates the refresh token and closes the session if an old one is replayed', async () => {
      const session = await signIn(newEmail('rotate'));
      const refreshed = await http()
        .post('/v1/auth/refresh')
        .send({ refreshToken: session.refreshToken })
        .expect(200);
      const next = refreshed.body as { accessToken: string; refreshToken: string };
      expect(next.refreshToken).not.toBe(session.refreshToken);
      await http().get('/v1/me').set('Authorization', `Bearer ${next.accessToken}`).expect(200);

      // Replaying the old token looks like theft: everything on that session stops working.
      await http().post('/v1/auth/refresh').send({ refreshToken: session.refreshToken }).expect(401);
      await http().post('/v1/auth/refresh').send({ refreshToken: next.refreshToken }).expect(401);
      await http().get('/v1/me').set('Authorization', `Bearer ${next.accessToken}`).expect(401);
    });

    it('logs out immediately', async () => {
      const session = await signIn(newEmail('logout'));
      await http().post('/v1/auth/logout').set('Authorization', `Bearer ${session.accessToken}`).expect(204);
      await http().get('/v1/me').set('Authorization', `Bearer ${session.accessToken}`).expect(401);
      await http().post('/v1/auth/refresh').send({ refreshToken: session.refreshToken }).expect(401);
    });

    it('stops a suspended person straight away', async () => {
      const session = await signIn(newEmail('suspend2'));
      await prisma.user.update({ where: { id: session.user.id }, data: { status: 'suspended' } });
      await http().get('/v1/me').set('Authorization', `Bearer ${session.accessToken}`).expect(401);
      await http().post('/v1/auth/refresh').send({ refreshToken: session.refreshToken }).expect(401);
    });

    it('rejects a session past its expiry date', async () => {
      const session = await signIn(newEmail('sessionexpiry'));
      await prisma.session.updateMany({
        where: { userId: session.user.id },
        data: { expiresAt: new Date(Date.now() - 1000) },
      });
      await http().get('/v1/me').set('Authorization', `Bearer ${session.accessToken}`).expect(401);
      await http().post('/v1/auth/refresh').send({ refreshToken: session.refreshToken }).expect(401);
    });
  });
});
