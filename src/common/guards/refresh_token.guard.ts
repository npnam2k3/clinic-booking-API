import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ENTITIES_MESSAGE } from 'src/common/constants/entities.message';
import { ERROR_MESSAGE } from 'src/common/constants/exception.message';
import configuration from '../../configs/load.env';

@Injectable()
export class RefreshTokenGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const cookieName = ENTITIES_MESSAGE.REFRESH_TOKEN;
    const refreshTokenFromCookie = request.cookies?.[cookieName];

    if (!refreshTokenFromCookie)
      throw new UnauthorizedException(ERROR_MESSAGE.EXPIRED_SESSION_LOGIN);

    // verify token
    try {
      const secretKeyRT = configuration().jwt_refresh_token_secret || '';

      const payload = await this.jwtService.verifyAsync(
        refreshTokenFromCookie,
        {
          secret: secretKeyRT,
        },
      );

      // gắn payload vào request để nhận ở controller
      request.user = payload;
      request.refreshToken = refreshTokenFromCookie;

      return true;
    } catch (error) {
      throw new UnauthorizedException(ERROR_MESSAGE.EXPIRED_SESSION_LOGIN);
    }
  }
}
