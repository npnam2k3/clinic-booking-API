import { IsOptional, IsString, Matches } from 'class-validator';
import { FULLNAME_REGEX, PHONE_REGEX } from 'src/modules/auth/regex';

export class UpdateUserDto {
  @IsOptional()
  @IsString({ message: 'Họ tên phải là 1 chuỗi' })
  @Matches(FULLNAME_REGEX, {
    message:
      'Họ tên chỉ được chứa chữ cái và khoảng trắng, không có số hoặc ký tự đặc biệt, không có khoảng trắng đầu hoặc cuối và không có khoảng trắng liên tiếp',
  })
  fullname: string;

  @IsOptional()
  @Matches(PHONE_REGEX, {
    message: 'Số điện thoại không hợp lệ',
  })
  phone_number: string;

  @IsOptional()
  @IsString({ message: 'Địa chỉ phải là 1 chuỗi' })
  address: string;
}
