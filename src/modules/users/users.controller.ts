import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt_auth.guard';
import { AuthorizationGuard } from 'src/common/guards/authorization.guard';
import { Permissions } from 'src/common/decorators/permission.decorator';
import { Action } from 'src/common/enums/action.enum';
import { Subject } from 'src/common/enums/subject.enum';
import { ResponseMessage } from 'src/common/decorators/response.decorator';
import { RESPONSE_MESSAGE } from 'src/common/constants/response.message';
import { PAGINATION } from 'src/common/constants/pagination';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard, AuthorizationGuard)
  @Permissions({ action: Action.create, subject: Subject.staff })
  @Post('staff')
  createStaff(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createStaff(createUserDto);
  }

  @Post()
  createUserClient(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUserClient(createUserDto);
  }

  @UseGuards(JwtAuthGuard, AuthorizationGuard)
  @Permissions({ action: Action.read, subject: Subject.user })
  @Get()
  findAllUserClient(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('keyword') keyword?: string,
  ) {
    const pageNum = page ? page : PAGINATION.USER.PAGE_NUMBER;
    const limitNum = limit ? limit : PAGINATION.USER.LIMIT_NUMBER;
    return this.usersService.findAllUserClient({
      pageNum,
      limitNum,
      keyword,
    });
  }

  @UseGuards(JwtAuthGuard, AuthorizationGuard)
  @Permissions({ action: Action.read, subject: Subject.staff })
  @Get('staff')
  findAllStaff() {
    return this.usersService.findAllStaff();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, AuthorizationGuard)
  @Permissions({ action: Action.read, subject: Subject.user })
  getDetailUserClient(@Param('id') id: string) {
    return this.usersService.getDetailUserClient(+id);
  }

  @Get('staff/:id')
  @UseGuards(JwtAuthGuard, AuthorizationGuard)
  @Permissions({ action: Action.read, subject: Subject.staff })
  getDetailStaff(@Param('id') id: string) {
    return this.usersService.getDetailStaff(+id);
  }

  @UseGuards(JwtAuthGuard, AuthorizationGuard)
  @Permissions({ action: Action.update, subject: Subject.staff })
  @ResponseMessage(RESPONSE_MESSAGE.UPDATE)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AuthorizationGuard)
  @Permissions({ action: Action.delete, subject: Subject.user })
  @ResponseMessage(RESPONSE_MESSAGE.DELETE)
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
