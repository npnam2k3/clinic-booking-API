import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateDoctorSlotDto {
  @IsNumber({}, { message: 'Mã bác sĩ phải là 1 số' })
  @Min(1, { message: 'Mã bác sĩ phải lớn hơn hoặc bằng 1' })
  doctor_id: number;

  @IsArray({ message: 'Danh sách các ngày làm việc không hợp lệ' })
  @ArrayMinSize(1, { message: 'Phải có ít nhất 1 ngày làm việc' })
  @ValidateNested({ each: true })
  @Type(() => SchedulesDoctorSlotDto)
  schedules: SchedulesDoctorSlotDto[];
}

class SchedulesDoctorSlotDto {
  @IsString()
  @IsNotEmpty()
  schedule_id: string;
}
