import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthDto } from './dto/auth.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { UserAccount } from 'src/modules/users/entities/user_account.entity';
import { Repository } from 'typeorm';
import { comparePassword } from 'src/common/utils/handle_password';
import { ERROR_MESSAGE } from 'src/common/constants/exception.message';
import configuration from 'src/configs/load.env';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { ENTITIES_MESSAGE } from 'src/common/constants/entities.message';
import { hashRefreshToken } from 'src/common/utils/handle_refreshToken';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserAccount)
    private readonly userRepo: Repository<UserAccount>,
    private readonly jwtService: JwtService,
  ) {}

  private TIME_EXPIRES_ACCESS_TOKEN: string = '30s';
  private TIME_EXPIRES_REFRESH_TOKEN: string = '7d';
  private MAX_AGE_COOKIE: number = 7 * 24 * 60 * 60 * 1000; // 7 days
  private PATH: string = '/';

  private readonly TOKEN_EXPIRATION_TIME = 60 * 15 * 1000; // 15 minutes

  // hàm đăng nhập
  async login(
    authDto: AuthDto,
    res: Response,
  ): Promise<{ accessToken: string }> {
    // kiểm tra thông tin tk user
    const checkUserExists = await this.validateUser(
      authDto.email,
      authDto.password,
    );

    // báo lỗi nếu thông tin tài khoản của user không đúng
    if (!checkUserExists) {
      throw new UnauthorizedException(ERROR_MESSAGE.INVALID_CREDENTIALS);
    }

    // kiểm tra tài khoản của user có bị block hay không
    if (checkUserExists.is_block) {
      throw new ForbiddenException(ERROR_MESSAGE.BLOCKED);
    }

    // không có lỗi
    // tạo 1 cặp token
    const { accessToken, refreshToken } = await this.signJwtToken(
      checkUserExists.user_id,
      checkUserExists.email,
    );

    // lưu refreshToken vào cookie
    this.saveRefreshTokenIntoCookie(res, refreshToken);

    // mã hóa refreshToken trước khi lưu vào database
    const hashedRefreshToken = await hashRefreshToken(refreshToken);

    // save RT into db
    await this.userRepo.update(checkUserExists.user_id, {
      hashed_refresh_token: hashedRefreshToken,
    });
    return { accessToken };
  }

  // hàm kiểm tra thông tin tk user
  async validateUser(
    email: string,
    password: string,
  ): Promise<UserAccount | null> {
    const existsUser = await this.userRepo.findOne({
      where: {
        email,
      },
    });

    if (
      existsUser &&
      (await comparePassword(password, existsUser.hashed_password))
    ) {
      return existsUser;
    }
    return null;
  }

  // hàm tạo 1 cặp token
  async signJwtToken(
    userId: number,
    email: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessTokenKey = configuration().jwt_access_token_secret;
    const refreshTokenKey = configuration().jwt_refresh_token_secret;

    const payloadAccessToken = { sub: userId, email };
    const payloadRefreshToken = { sub: userId };
    const jwtAccessTokenString = await this.jwtService.signAsync(
      payloadAccessToken,
      {
        expiresIn: this.TIME_EXPIRES_ACCESS_TOKEN,
        secret: accessTokenKey,
      },
    );
    const jwtRefreshTokenString = await this.jwtService.signAsync(
      payloadRefreshToken,
      {
        expiresIn: this.TIME_EXPIRES_REFRESH_TOKEN,
        secret: refreshTokenKey,
      },
    );
    return {
      accessToken: jwtAccessTokenString,
      refreshToken: jwtRefreshTokenString,
    };
  }

  // hàm lưu refreshToken vào cookie
  saveRefreshTokenIntoCookie(res: Response, refreshToken: string) {
    res.cookie(ENTITIES_MESSAGE.REFRESH_TOKEN, refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: this.MAX_AGE_COOKIE,
      path: this.PATH,
    });
  }

  // hàm xóa refreshToken trong cookie
  removeRefreshTokenInCookie(res: Response) {
    res.cookie(ENTITIES_MESSAGE.REFRESH_TOKEN, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: this.PATH,
    });
  }

  // hàm đăng xuất
  async logout(res: Response, userId: number) {
    // xóa refreshToken trong cookie
    this.removeRefreshTokenInCookie(res);

    // cập nhật trường hashed_refresh_token trong bảng user_accounts = null
    await this.userRepo.update(userId, { hashed_refresh_token: null });
  }

  async getProfile(userId: number) {
    return 'ok';
  }
}
