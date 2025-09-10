import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
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
  @Permissions({ action: Action.read, subject: Subject.staff })
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard, AuthorizationGuard)
  @Permissions({ action: Action.update, subject: Subject.staff })
  @ResponseMessage(RESPONSE_MESSAGE.UPDATE)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
