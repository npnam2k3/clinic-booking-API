import {
  IsArray,
  ValidateNested,
  IsNumber,
  IsString,
  IsOptional,
  Matches,
  IsIn,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { REGEX_TIME } from 'src/modules/work_schedules/dto/create-work_schedule.dto';

export class UpdateDayWorkDto {
  @IsNumber()
  @Min(1)
  schedule_id: number;

  @IsString({ message: 'Ngày làm việc phải là 1 chuỗi' })
  @IsIn([
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ])
  day_of_week: string;

  // validate định dạng HH:mm
  @IsString()
  @Matches(REGEX_TIME)
  start_time: string;

  @IsString()
  @Matches(REGEX_TIME)
  end_time: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsNumber()
  @Min(5)
  slot_duration: number;
}

export class UpdateWorkScheduleDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateDayWorkDto)
  schedules: UpdateDayWorkDto[];
}
