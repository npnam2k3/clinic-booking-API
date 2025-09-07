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
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto/auth.dto';
import type { Response } from 'express';
import { JwtAuthGuard } from 'src/common/guards/jwt_auth.guard';
import { ProfileDto } from 'src/modules/auth/dto/profile.dto';
import { ResponseMessage } from 'src/common/decorators/response.decorator';
import { RESPONSE_MESSAGE } from 'src/common/constants/response.message';

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
}
