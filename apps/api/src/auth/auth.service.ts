import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
  UnprocessableEntityException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SignJWT, jwtVerify } from 'jose';
import { EmailSender } from '../email/email-sender.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  generateLoginCode,
  generateRefreshToken,
  hashLoginCode,
  hashToken,
  safeEqual,
} from './auth-crypto.js';

export const CODE_TTL_MS = 10 * 60 * 1000;
export const MAX_CODE_ATTEMPTS = 5;
export const MAX_CODES_PER_WINDOW = 3;
export const CODE_WINDOW_MS = 15 * 60 * 1000;
export const RESEND_COOLDOWN_MS = 60 * 1000;
export const ACCESS_TTL_SECONDS = 15 * 60;
export const REFRESH_TTL_MS = 60 * 24 * 60 * 60 * 1000;
export const TERMS_DOCUMENT = 'terms_and_privacy';
export const TERMS_VERSION = 'draft-1';

const ISSUER = 'edulink-api';
const AUDIENCE = 'edulink-app';
const INVALID_CODE_MESSAGE = 'Invalid or expired code';

export interface AuthContext {
  userId: string;
  sessionId: string;
}

export interface AuthTokensDto {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
}

export interface VerifyResultDto extends AuthTokensDto {
  isNewUser: boolean;
  user: { id: string; email: string };
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ConfigService) private readonly config: ConfigService,
    @Inject(EmailSender) private readonly email: EmailSender,
  ) {}

  private get accessKey(): Uint8Array {
    return new TextEncoder().encode(this.config.getOrThrow<string>('JWT_ACCESS_SECRET'));
  }

  private get codeSecret(): string {
    return this.config.getOrThrow<string>('AUTH_CODE_SECRET');
  }

  static normaliseEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  // Sign-up and sign-in are the same step: any valid address can ask for a code.
  async requestCode(rawEmail: string): Promise<{ message: string }> {
    const email = AuthService.normaliseEmail(rawEmail);
    const now = Date.now();

    const recent = await this.prisma.loginCode.findMany({
      where: { email, createdAt: { gte: new Date(now - CODE_WINDOW_MS) } },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    const latest = recent[0];
    if (latest && now - latest.createdAt.getTime() < RESEND_COOLDOWN_MS) {
      const wait = Math.ceil((RESEND_COOLDOWN_MS - (now - latest.createdAt.getTime())) / 1000);
      throw new HttpException(
        { message: 'Please wait before asking for another code', retryAfterSeconds: wait },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    const oldest = recent[recent.length - 1];
    if (recent.length >= MAX_CODES_PER_WINDOW && oldest) {
      const wait = Math.ceil((CODE_WINDOW_MS - (now - oldest.createdAt.getTime())) / 1000);
      throw new HttpException(
        { message: 'Too many codes requested. Try again later', retryAfterSeconds: wait },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const code = generateLoginCode();
    await this.prisma.loginCode.create({
      data: {
        email,
        codeHash: hashLoginCode(this.codeSecret, email, code),
        expiresAt: new Date(now + CODE_TTL_MS),
      },
    });

    try {
      await this.email.sendLoginCode(email, code);
    } catch {
      throw new ServiceUnavailableException('Could not send the email. Please try again shortly');
    }

    // Same answer whether or not the address already has an account.
    return { message: 'If the address can receive email, a sign-in code is on its way' };
  }

  async verifyCode(input: {
    email: string;
    code: string;
    acceptTerms?: boolean;
    deviceName?: string;
  }): Promise<VerifyResultDto> {
    const email = AuthService.normaliseEmail(input.email);
    const now = new Date();

    const record = await this.prisma.loginCode.findFirst({
      where: { email, consumedAt: null, expiresAt: { gt: now } },
      orderBy: { createdAt: 'desc' },
    });
    if (!record || record.attempts >= MAX_CODE_ATTEMPTS) {
      throw new UnauthorizedException(INVALID_CODE_MESSAGE);
    }

    const expected = hashLoginCode(this.codeSecret, email, input.code);
    if (!safeEqual(expected, record.codeHash)) {
      const updated = await this.prisma.loginCode.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });
      if (updated.attempts >= MAX_CODE_ATTEMPTS) {
        await this.prisma.loginCode.update({ where: { id: record.id }, data: { consumedAt: now } });
      }
      throw new UnauthorizedException(INVALID_CODE_MESSAGE);
    }

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing && existing.status !== 'active') {
      throw new ForbiddenException('This account cannot sign in');
    }
    if (!existing && input.acceptTerms !== true) {
      // The code stays valid so the app can ask the person to accept and try again.
      throw new UnprocessableEntityException({
        error: 'terms_required',
        message: 'Please accept the terms and privacy policy to create your account',
      });
    }

    // Burn the code first; only one request can win this race.
    const burned = await this.prisma.loginCode.updateMany({
      where: { id: record.id, consumedAt: null },
      data: { consumedAt: now },
    });
    if (burned.count !== 1) {
      throw new UnauthorizedException(INVALID_CODE_MESSAGE);
    }

    const user = existing
      ? await this.prisma.user.update({
          where: { id: existing.id },
          data: { lastLoginAt: now, emailVerifiedAt: existing.emailVerifiedAt ?? now },
        })
      : await this.prisma.user.create({
          data: {
            email,
            emailVerifiedAt: now,
            lastLoginAt: now,
            consents: { create: { document: TERMS_DOCUMENT, version: TERMS_VERSION } },
          },
        });

    const refreshToken = generateRefreshToken();
    const session = await this.prisma.session.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        deviceName: input.deviceName?.trim() || null,
        expiresAt: new Date(now.getTime() + REFRESH_TTL_MS),
      },
    });

    return {
      accessToken: await this.signAccessToken(user.id, session.id),
      refreshToken,
      expiresInSeconds: ACCESS_TTL_SECONDS,
      isNewUser: !existing,
      user: { id: user.id, email: user.email },
    };
  }

  // Every refresh swaps the token for a new one. Presenting an old token again means it
  // may have been stolen, so the whole session is closed.
  async refresh(refreshToken: string): Promise<AuthTokensDto> {
    const now = new Date();
    const tokenHash = hashToken(refreshToken);

    const session = await this.prisma.session.findUnique({
      where: { tokenHash },
      include: { user: { select: { status: true } } },
    });

    if (!session) {
      await this.prisma.session.updateMany({
        where: { previousTokenHash: tokenHash, revokedAt: null },
        data: { revokedAt: now },
      });
      throw new UnauthorizedException('Please sign in again');
    }
    if (session.revokedAt || session.expiresAt <= now || session.user.status !== 'active') {
      throw new UnauthorizedException('Please sign in again');
    }

    const nextToken = generateRefreshToken();
    const rotated = await this.prisma.session.updateMany({
      where: { id: session.id, tokenHash, revokedAt: null },
      data: { previousTokenHash: tokenHash, tokenHash: hashToken(nextToken), lastUsedAt: now },
    });
    if (rotated.count !== 1) {
      throw new UnauthorizedException('Please sign in again');
    }

    return {
      accessToken: await this.signAccessToken(session.userId, session.id),
      refreshToken: nextToken,
      expiresInSeconds: ACCESS_TTL_SECONDS,
    };
  }

  async logout(sessionId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  // Used by the guard on every protected request. Checking the session row means
  // logging out or suspending someone takes effect immediately, not after 15 minutes.
  async authenticate(accessToken: string): Promise<AuthContext> {
    try {
      const { payload } = await jwtVerify(accessToken, this.accessKey, {
        issuer: ISSUER,
        audience: AUDIENCE,
        algorithms: ['HS256'],
      });
      const userId = payload.sub;
      const sessionId = payload['sid'];
      if (typeof userId !== 'string' || typeof sessionId !== 'string') {
        throw new Error('bad claims');
      }

      const session = await this.prisma.session.findUnique({
        where: { id: sessionId },
        include: { user: { select: { status: true } } },
      });
      if (
        !session ||
        session.userId !== userId ||
        session.revokedAt ||
        session.expiresAt <= new Date() ||
        session.user.status !== 'active'
      ) {
        throw new Error('inactive session');
      }
      return { userId, sessionId };
    } catch {
      throw new UnauthorizedException();
    }
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, emailVerifiedAt: true, createdAt: true },
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }

  private signAccessToken(userId: string, sessionId: string): Promise<string> {
    return new SignJWT({ sid: sessionId })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(userId)
      .setIssuer(ISSUER)
      .setAudience(AUDIENCE)
      .setIssuedAt()
      .setExpirationTime(`${ACCESS_TTL_SECONDS}s`)
      .sign(this.accessKey);
  }
}
