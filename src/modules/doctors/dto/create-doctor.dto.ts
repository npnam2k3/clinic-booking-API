import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';
import {
  EMAIL_REGEX,
  FULLNAME_REGEX,
  PHONE_REGEX,
} from 'src/modules/auth/regex';
import { Gender } from 'src/modules/patients/enum';

export class CreateDoctorDto {
  @IsString({ message: 'Họ tên phải là 1 chuỗi' })
  @IsNotEmpty({ message: 'Họ tên không được để trống' })
  @Matches(FULLNAME_REGEX, {
    message:
      'Họ tên chỉ được chứa chữ cái và khoảng trắng, không có số hoặc ký tự đặc biệt, không có khoảng trắng đầu hoặc cuối và không có khoảng trắng liên tiếp',
  })
  fullname: string;

  @IsNotEmpty({ message: 'Giới tính không được để trống' })
  @IsEnum(Gender, {
    message: 'Giới tính phải là 1 trong 2 giá trị sau: male hoặc female',
  })
  gender: Gender;

  @IsString({ message: 'Trình độ chuyên môn phải là 1 chuỗi' })
  @IsNotEmpty({ message: 'Trình độ chuyên môn không được để trống' })
  degree: string;

  @IsString({ message: 'Chức vụ phải là 1 chuỗi' })
  @IsNotEmpty({ message: 'Chức vụ không được để trống' })
  position: string;

  @IsString({ message: 'Mô tả phải là 1 chuỗi' })
  description: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'Số năm kinh nghiệm phải là 1 số' })
  @Min(1, { message: 'Số năm kinh nghiệm phải >= 1' })
  @Max(60, { message: 'Số năm kinh nghiệm phải <= 60' })
  years_of_experience: number;

  @IsString({ message: 'Email phải là 1 chuỗi' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  @Matches(EMAIL_REGEX, {
    message: 'Email không hợp lệ',
  })
  email: string;

  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @Matches(PHONE_REGEX, {
    message: 'Số điện thoại không hợp lệ',
  })
  phone_number: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'Mã chuyên khoa phải là 1 số' })
  @Min(1, { message: 'Mã chuyên khoa phải >= 1' })
  specialization_id: number;
}
