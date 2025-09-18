import { Transform } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  Matches,
  Min,
} from 'class-validator';
import moment from 'moment';
import { FULLNAME_REGEX } from 'src/modules/auth/regex';
import { Gender } from 'src/modules/patients/enum';

export class CreateAppointmentDto {
  @Transform(({ value }) => {
    // Parse chuỗi DD/MM/YYYY sang Date
    const date = moment(value, 'DD/MM/YYYY', true);
    return date.isValid() ? date.toDate() : value;
  })
  @IsDate({
    message: 'Ngày đặt lịch hẹn không hợp lệ, định dạng phải DD/MM/YYYY',
  })
  appointment_date: string;

  @IsNumber({}, { message: 'Mã ca khám phải là 1 chuỗi' })
  @Min(1, { message: 'Mã ca khám phải lớn hơn 0' })
  slot_id: number;

  @IsString({ message: 'Họ tên phải là 1 chuỗi' })
  @IsNotEmpty({ message: 'Họ tên không được để trống' })
  @Matches(FULLNAME_REGEX, {
    message:
      'Họ tên chỉ được chứa chữ cái và khoảng trắng, không có số hoặc ký tự đặc biệt, không có khoảng trắng đầu hoặc cuối và không có khoảng trắng liên tiếp',
  })
  fullname: string;

  @Transform(({ value }) => {
    // Parse chuỗi DD/MM/YYYY sang Date
    const date = moment(value, 'DD/MM/YYYY', true);
    return date.isValid() ? date.toDate() : value;
  })
  @IsDate({
    message: 'Ngày sinh không hợp lệ, định dạng phải DD/MM/YYYY',
  })
  date_of_birth: string;

  @IsNotEmpty({ message: 'Giới tính không được để trống' })
  @IsEnum(Gender, {
    message: 'Giới tính phải là 1 trong 2 giá trị sau: male hoặc female',
  })
  gender: Gender;

  @IsString({ message: 'Ghi chú phải là định dạng chuỗi' })
  note: string;

  @IsString({ message: 'Địa chỉ phải là định dạng chuỗi' })
  address: string;
}
