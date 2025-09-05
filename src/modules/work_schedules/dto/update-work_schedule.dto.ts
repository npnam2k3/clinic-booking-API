import { PartialType } from '@nestjs/mapped-types';
import { CreateWorkScheduleDto } from './create-work_schedule.dto';

export class UpdateWorkScheduleDto extends PartialType(CreateWorkScheduleDto) {}
