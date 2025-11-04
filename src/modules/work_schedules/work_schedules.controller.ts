import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Get,
} from '@nestjs/common';
import { WorkSchedulesService } from './work_schedules.service';
import { CreateWorkScheduleDto } from './dto/create-work_schedule.dto';
import { UpdateWorkScheduleDto } from './dto/update-work_schedule.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt_auth.guard';
import { AuthorizationGuard } from 'src/common/guards/authorization.guard';
import { Permissions } from 'src/common/decorators/permission.decorator';
import { Action } from 'src/common/enums/action.enum';
import { Subject } from 'src/common/enums/subject.enum';
import { ResponseMessage } from 'src/common/decorators/response.decorator';
import { RESPONSE_MESSAGE } from 'src/common/constants/response.message';

@Controller('work-schedules')
export class WorkSchedulesController {
  constructor(private readonly workSchedulesService: WorkSchedulesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, AuthorizationGuard)
  @Permissions({ action: Action.create, subject: Subject.work_schedule })
  @ResponseMessage(RESPONSE_MESSAGE.CREATE)
  create(@Body() createWorkScheduleDto: CreateWorkScheduleDto) {
    return this.workSchedulesService.create(createWorkScheduleDto);
  }

  @Get('old-work-schedule')
  @UseGuards(JwtAuthGuard, AuthorizationGuard)
  @Permissions({ action: Action.read, subject: Subject.work_schedule })
  @ResponseMessage(RESPONSE_MESSAGE.GET)
  getOldWorkSchedule() {
    return this.workSchedulesService.getOldWorkSchedule();
  }

  @Get('new-work-schedule')
  @UseGuards(JwtAuthGuard, AuthorizationGuard)
  @Permissions({ action: Action.read, subject: Subject.work_schedule })
  @ResponseMessage(RESPONSE_MESSAGE.GET)
  getNewWorkSchedule() {
    return this.workSchedulesService.getNewWorkSchedule();
  }

  // @Patch(':doctor_id')
  // @UseGuards(JwtAuthGuard, AuthorizationGuard)
  // @Permissions({ action: Action.update, subject: Subject.work_schedule })
  // @ResponseMessage(RESPONSE_MESSAGE.UPDATE)
  // update(
  //   @Param('doctor_id') doctorId: string,
  //   @Body() updateWorkScheduleDto: UpdateWorkScheduleDto,
  // ) {
  //   return this.workSchedulesService.update(+doctorId, updateWorkScheduleDto);
  // }

  // @Delete(':id')
  // @UseGuards(JwtAuthGuard, AuthorizationGuard)
  // @Permissions({ action: Action.delete, subject: Subject.work_schedule })
  // @ResponseMessage(RESPONSE_MESSAGE.DELETE)
  // remove(@Param('id') id: string) {
  //   return this.workSchedulesService.remove(+id);
  // }
}
