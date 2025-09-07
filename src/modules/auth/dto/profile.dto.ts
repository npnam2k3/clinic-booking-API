import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { FULLNAME_REGEX, PHONE_REGEX } from 'src/modules/auth/regex';

export class ProfileDto {
  @IsString({ message: 'Họ tên phải là 1 chuỗi' })
  @IsNotEmpty({ message: 'Họ tên không được để trống' })
  @Matches(FULLNAME_REGEX, {
    message:
      'Họ tên chỉ được chứa chữ cái và khoảng trắng, không có số hoặc ký tự đặc biệt, không có khoảng trắng đầu hoặc cuối và không có khoảng trắng liên tiếp',
  })
  @MinLength(2, { message: 'Họ tên phải có ít nhất 2 ký tự' })
  @MaxLength(50, { message: 'Họ tên không được quá 50 ký tự' })
  fullname: string;

  @Transform(({ value }) =>
    value && typeof value === 'string' ? value?.trim() : value,
  )
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @Matches(PHONE_REGEX, {
    message: 'Số điện thoại không hợp lệ',
  })
  phone_number: string;

  @IsString({ message: 'Địa chỉ phải là 1 chuỗi' })
  address: string;
}
