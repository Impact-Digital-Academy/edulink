import { type ExecutionContext, UnauthorizedException, createParamDecorator } from '@nestjs/common';
import type { AuthenticatedRequest } from './access-token.guard.js';

// Use on a route that already has AccessTokenGuard: gives the signed-in person's ids.
export const CurrentAuth = createParamDecorator((_data: unknown, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
  if (!request.auth) {
    throw new UnauthorizedException();
  }
  return request.auth;
});
