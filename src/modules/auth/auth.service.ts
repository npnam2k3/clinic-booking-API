import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthDto } from './dto/auth.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { UserAccount } from 'src/modules/users/entities/user_account.entity';
import { MoreThan, Not, Repository } from 'typeorm';
import {
  comparePassword,
  hashPassword,
} from 'src/common/utils/handle_password';
import { ERROR_MESSAGE } from 'src/common/constants/exception.message';
import configuration from 'src/configs/load.env';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { ENTITIES_MESSAGE } from 'src/common/constants/entities.message';
import { hashRefreshToken } from 'src/common/utils/handle_refreshToken';
import { removeEmptyFields, toDTO } from 'src/common/utils/mapToDto';
import { UserResponseDTO } from 'src/modules/users/dto/response-user.dto';
import { ProfileDto } from 'src/modules/auth/dto/profile.dto';
import { Contact } from 'src/modules/users/entities/contact.entity';
import { randomBytes } from 'crypto';
import { MailService } from 'src/common/mail/mail.service';
import { ResetPasswordDTO } from 'src/modules/auth/dto/resetPassword.dto';
import { ChangePasswordDTO } from 'src/modules/auth/dto/changePassword.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserAccount)
    private readonly userRepo: Repository<UserAccount>,

    @InjectRepository(Contact)
    private readonly contactRepo: Repository<Contact>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  private TIME_EXPIRES_ACCESS_TOKEN: string = '1d';
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

  // hàm xem thông tin cá nhân
  async getProfile(userId: number) {
    const userExists = await this.userRepo.findOne({
      where: {
        user_id: userId,
      },
      relations: {
        contact: true,
        role: true,
      },
    });

    // loại bỏ đi những trường không cần thiết
    const result = toDTO<UserResponseDTO, UserAccount | null>(
      UserResponseDTO,
      userExists,
    );
    return result;
  }

  // hàm cập nhật thông tin cá nhân
  async updateProfile(userId: number, profileDto: ProfileDto) {
    const cleanDto = removeEmptyFields(profileDto);

    if (Object.keys(cleanDto).includes('phone_number')) {
      const checkPhoneNumberExists = await this.contactRepo.count({
        where: {
          phone_number: profileDto.phone_number,
          user_account: {
            user_id: Not(userId),
          },
        },
      });
      if (checkPhoneNumberExists > 0) {
        throw new ConflictException(ERROR_MESSAGE.PHONE_NUMBER_EXISTS);
      }
    }

    await this.contactRepo.update(
      {
        user_account: { user_id: userId },
      },
      cleanDto,
    );
  }

  // hàm quên mật khẩu
  async forgotPassword(email: string) {
    // kiểm tra email có tồn tại không
    const userExists = await this.userRepo.findOne({
      where: {
        email,
      },
      relations: {
        contact: true,
      },
    });

    // báo lỗi nếu không tồn tại
    if (!userExists) throw new NotFoundException(ERROR_MESSAGE.EMAIL_NOT_FOUND);

    // tạo token reset password
    const tokenReset = randomBytes(32).toString('hex');

    // lưu token và thời gian hết hạn của token vào bảng user_accounts
    userExists.token_reset_password = tokenReset;
    userExists.token_reset_password_expiration = new Date(
      Date.now() + this.TOKEN_EXPIRATION_TIME,
    );
    await this.userRepo.save(userExists);

    // gửi email
    try {
      await this.mailService.sendEmail(userExists, tokenReset);
    } catch (error) {
      console.error(`Email sending failed for ${email}:`, error);
      throw new InternalServerErrorException(
        ERROR_MESSAGE.INTERNAL_ERROR_SERVER,
      );
    }
  }

  // hàm đặt lại mật khẩu
  async resetPassword(tokenReset: string, resetPasswordDTO: ResetPasswordDTO) {
    // tìm user theo token đồng thời kiểm tra thời hạn của token
    const userExists = await this.userRepo.findOne({
      where: {
        token_reset_password: tokenReset,
        token_reset_password_expiration: MoreThan(new Date()),
      },
    });

    // nếu không tồn tại thì báo lỗi
    if (!userExists) {
      throw new NotFoundException(ERROR_MESSAGE.USER_NOT_FOUND);
    }

    // kiểm tra mật khẩu mới và mật khẩu xác nhận có giống nhau hay không
    if (resetPasswordDTO.new_password !== resetPasswordDTO.confirm_password) {
      throw new BadRequestException(ERROR_MESSAGE.INVALID_CONFIRM_PASSWORD);
    }

    // mã hóa mật khẩu mới
    const hashedNewPassword = await hashPassword(resetPasswordDTO.new_password);

    // cập nhật mật khẩu mới đã mã hóa vào bảng user_accounts
    userExists.hashed_password = hashedNewPassword;

    // cập nhật các trường reset mật khẩu thành null
    userExists.token_reset_password = null;
    userExists.token_reset_password_expiration = null;

    // cập nhật refresh_token thành null để logout người dùng
    userExists.hashed_refresh_token = null;

    // lưu lại user đã cập nhật
    await this.userRepo.save(userExists);
  }

  // hàm đổi mật khẩu
  async changePassword(
    changePasswordDTO: ChangePasswordDTO,
    userId: number,
    res: Response,
  ) {
    // kiểm tra mật khẩu mới và mật khẩu xác nhận phải bằng nhau
    if (changePasswordDTO.confirm_password !== changePasswordDTO.new_password) {
      throw new BadRequestException(ERROR_MESSAGE.INVALID_CONFIRM_PASSWORD);
    }

    // kiểm tra mật khẩu hiện tại phải chính xác
    const user = await this.userRepo.findOne({
      where: {
        user_id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException(ERROR_MESSAGE.USER_NOT_FOUND);
    }
    const matchPassword = await comparePassword(
      changePasswordDTO.current_password,
      user.hashed_password,
    );
    if (!matchPassword) {
      throw new BadRequestException(ERROR_MESSAGE.WRONG_PASSWORD);
    }

    // kiểm tra mật khẩu cũ và mật khẩu mới phải khác nhau
    if (changePasswordDTO.new_password === changePasswordDTO.current_password) {
      throw new BadRequestException(ERROR_MESSAGE.DUPLICATE_PASSWORD);
    }

    // mã hóa mật khẩu mới
    const hashedNewPassword = await hashPassword(
      changePasswordDTO.new_password,
    );

    // lưu mật khẩu đã mã hóa vào db
    await this.userRepo.update(userId, {
      hashed_password: hashedNewPassword,
    });

    // logout
    await this.logout(res, userId);
  }
}
