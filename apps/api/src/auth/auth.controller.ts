import { Body, Controller, Get, HttpCode, Inject, Post, UseGuards } from '@nestjs/common';
import { AccessTokenGuard } from './access-token.guard.js';
import { RefreshDto, RequestCodeDto, VerifyCodeDto } from './auth.dto.js';
import { type AuthContext, AuthService } from './auth.service.js';
import { CurrentAuth } from './current-auth.decorator.js';

@Controller()
export class AuthController {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}

  @Post('auth/request-code')
  @HttpCode(202)
  requestCode(@Body() dto: RequestCodeDto) {
    return this.auth.requestCode(dto.email);
  }

  @Post('auth/verify-code')
  @HttpCode(200)
  verifyCode(@Body() dto: VerifyCodeDto) {
    return this.auth.verifyCode(dto);
  }

  @Post('auth/refresh')
  @HttpCode(200)
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @Post('auth/logout')
  @HttpCode(204)
  @UseGuards(AccessTokenGuard)
  async logout(@CurrentAuth() auth: AuthContext): Promise<void> {
    await this.auth.logout(auth.sessionId);
  }

  @Get('me')
  @UseGuards(AccessTokenGuard)
  me(@CurrentAuth() auth: AuthContext) {
    return this.auth.getMe(auth.userId);
  }
}
