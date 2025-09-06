import {
  Controller,
  Post,
  Body,
  Res,
  HttpCode,
  Get,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto/auth.dto';
import type { Response } from 'express';
import { JwtAuthGuard } from 'src/common/guards/jwt_auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  login(@Body() authDto: AuthDto, @Res({ passthrough: true }) res: Response) {
    return this.authService.login(authDto, res);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    const { sub } = req.user;
    return this.authService.getProfile(+sub);
  }
}
