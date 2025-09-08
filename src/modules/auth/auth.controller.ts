import {
  Controller,
  Post,
  Body,
  Res,
  HttpCode,
  Get,
  Request,
  UseGuards,
  Patch,
  Param,
  Put,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto/auth.dto';
import type { Response } from 'express';
import { JwtAuthGuard } from 'src/common/guards/jwt_auth.guard';
import { ProfileDto } from 'src/modules/auth/dto/profile.dto';
import { ResponseMessage } from 'src/common/decorators/response.decorator';
import { RESPONSE_MESSAGE } from 'src/common/constants/response.message';
import { ForgotPasswordDTO } from 'src/modules/auth/dto/forgotPassword.dto';
import { ResetPasswordDTO } from 'src/modules/auth/dto/resetPassword.dto';
import { ChangePasswordDTO } from 'src/modules/auth/dto/changePassword.dto';
import { RefreshTokenGuard } from 'src/common/guards/refresh_token.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  login(@Body() authDto: AuthDto, @Res({ passthrough: true }) res: Response) {
    return this.authService.login(authDto, res);
  }

  @Post('logout')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  logout(@Request() req, @Res({ passthrough: true }) res: Response) {
    const { sub } = req.user;
    return this.authService.logout(res, +sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    const { sub } = req.user;

    return this.authService.getProfile(+sub);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  @ResponseMessage(RESPONSE_MESSAGE.UPDATE)
  updateProfile(@Request() req, @Body() profileDto: ProfileDto) {
    const { sub } = req.user;
    return this.authService.updateProfile(+sub, profileDto);
  }

  @Post('forgot-password')
  @ResponseMessage(RESPONSE_MESSAGE.SEND_EMAIL)
  @HttpCode(200)
  forgotPassword(@Body() forgotPasswordDTO: ForgotPasswordDTO) {
    const { email } = forgotPasswordDTO;
    return this.authService.forgotPassword(email);
  }

  @Put('reset-password/:token')
  @ResponseMessage(RESPONSE_MESSAGE.CHANGE_PASSWORD)
  resetPassword(
    @Param('token') token: string,
    @Body() resetPasswordDTO: ResetPasswordDTO,
  ) {
    return this.authService.resetPassword(token, resetPasswordDTO);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @ResponseMessage(RESPONSE_MESSAGE.CHANGE_PASSWORD)
  changePassword(
    @Body() changePasswordDTO: ChangePasswordDTO,
    @Request() req,
    @Res({ passthrough: true }) res: any,
  ) {
    const { sub } = req.user;
    return this.authService.changePassword(changePasswordDTO, +sub, res);
  }

  @UseGuards(RefreshTokenGuard)
  @HttpCode(200)
  @Post('refresh-token')
  refreshToken(@Request() req, @Res({ passthrough: true }) res: Response) {
    const { sub } = req.user;
    const refreshTokenOld = req.refreshToken;
    return this.authService.refreshToken(+sub, refreshTokenOld, res);
  }
}
