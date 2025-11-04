import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import moment from 'moment';

export class CreateDoctorSlotDto {
  @IsNumber({}, { message: 'Mã bác sĩ phải là 1 số' })
  @Min(1, { message: 'Mã bác sĩ phải lớn hơn hoặc bằng 1' })
  doctor_id: number;

  @Transform(({ value }) => {
    // Parse chuỗi DD/MM/YYYY sang Date
    const date = moment(value, 'DD/MM/YYYY', true);
    return date.isValid() ? date.toDate() : value;
  })
  @IsDate({
    message:
      'Ngày bắt đầu chia ca khám không hợp lệ, định dạng phải DD/MM/YYYY',
  })
  from_date: string;

  @Transform(({ value }) => {
    // Parse chuỗi DD/MM/YYYY sang Date
    const date = moment(value, 'DD/MM/YYYY', true);
    return date.isValid() ? date.toDate() : value;
  })
  @IsDate({
    message: 'Ngày kết thúc không hợp lệ, định dạng phải DD/MM/YYYY',
  })
  to_date: string;

  // @IsBoolean()
  // is_new: boolean;
}
