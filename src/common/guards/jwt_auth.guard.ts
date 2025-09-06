import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { ERROR_MESSAGE } from 'src/common/constants/exception.message';

import configuration from 'src/configs/load.env';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) throw new UnauthorizedException(ERROR_MESSAGE.UNAUTHENTICATED);

    try {
      // verify token
      const payload = await this.jwtService.verifyAsync(token, {
        secret: configuration().jwt_access_token_secret || '',
      });

      // gán payload vào request
      request['user'] = payload;
    } catch (error) {
      throw this.mapJwtError(error);
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];

    return type === 'Bearer' ? token : undefined;
  }

  // hàm phân loại lỗi jwt
  private mapJwtError(error: any): UnauthorizedException {
    type JwtErrorName = 'TokenExpiredError' | 'JsonWebTokenError';
    const errorMap: Record<JwtErrorName, string> = {
      TokenExpiredError: ERROR_MESSAGE.TOKEN_EXPIRED_ERROR,
      JsonWebTokenError: ERROR_MESSAGE.INVALID_TOKEN,
    };
    const message = errorMap[error.name] || ERROR_MESSAGE.UNAUTHENTICATED;
    return new UnauthorizedException(message);
  }
}
