import {
  IsArray,
  ValidateNested,
  IsNumber,
  IsString,
  IsOptional,
  IsIn,
  Matches,
  Min,
  ArrayMinSize,
  IsDate,
  Validate,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import moment from 'moment';
import { IsValidDateConstraint } from 'src/common/utils/validationCustom';

export const REGEX_TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;
export class CreateWorkScheduleDto {
  @IsArray({ message: 'Danh sách các ngày làm việc không hợp lệ' })
  @ArrayMinSize(1, { message: 'Phải có ít nhất 1 ngày làm việc' })
  @ValidateNested({ each: true })
  @Type(() => DayWorkDto)
  schedules: DayWorkDto[];

  @IsNumber({}, { message: 'Thời lượng khám phải là 1 số' })
  @Min(5, { message: 'Thời lượng khám ít nhất là 5 phút' })
  slot_duration: number;

  @IsNumber({}, { message: 'Mã bác sĩ phải là 1 số' })
  @Min(1, { message: 'Mã bác sĩ phải lớn hơn hoặc bằng 1' })
  doctor_id: number;

  @Validate(IsValidDateConstraint, {
    message:
      'Ngày áp dụng lịch làm việc không hợp lệ, định dạng phải DD/MM/YYYY',
  })
  effective_date: string;

  @Validate(IsValidDateConstraint, {
    message:
      'Ngày hết hạn lịch làm việc không hợp lệ, định dạng phải DD/MM/YYYY',
  })
  expire_date: string;
}

export class DayWorkDto {
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
}
