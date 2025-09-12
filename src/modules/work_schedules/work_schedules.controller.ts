import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
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

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateWorkScheduleDto: UpdateWorkScheduleDto,
  ) {
    return this.workSchedulesService.update(+id, updateWorkScheduleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.workSchedulesService.remove(+id);
  }
}
