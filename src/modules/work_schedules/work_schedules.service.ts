import { Injectable } from '@nestjs/common';
import { CreateWorkScheduleDto } from './dto/create-work_schedule.dto';
import { UpdateWorkScheduleDto } from './dto/update-work_schedule.dto';

@Injectable()
export class WorkSchedulesService {
  create(createWorkScheduleDto: CreateWorkScheduleDto) {
    return 'This action adds a new workSchedule';
  }

  findAll() {
    return `This action returns all workSchedules`;
  }

  findOne(id: number) {
    return `This action returns a #${id} workSchedule`;
  }

  update(id: number, updateWorkScheduleDto: UpdateWorkScheduleDto) {
    return `This action updates a #${id} workSchedule`;
  }

  remove(id: number) {
    return `This action removes a #${id} workSchedule`;
  }
}
