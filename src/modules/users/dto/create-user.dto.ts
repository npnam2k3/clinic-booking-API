import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  EMAIL_REGEX,
  FULLNAME_REGEX,
  PASSWORD_REGEX,
  PHONE_REGEX,
} from 'src/modules/auth/regex';

export class CreateUserDto {
  @IsString({ message: 'Email phải là 1 chuỗi' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  @Matches(EMAIL_REGEX, {
    message: 'Email không hợp lệ',
  })
  email: string;

  @IsString({ message: 'Mật khẩu phải là 1 chuỗi' })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  @MaxLength(30, { message: 'Mật khẩu không được quá 30 ký tự' })
  @Matches(PASSWORD_REGEX, {
    message:
      'Mật khẩu phải có ít nhất 1 chữ hoa, 3 chữ thường, 1 số, 1 ký tự đặc biệt và không chứa khoảng trắng và không dấu',
  })
  password: string;

  @IsString({ message: 'Họ tên phải là 1 chuỗi' })
  @IsNotEmpty({ message: 'Họ tên không được để trống' })
  @Matches(FULLNAME_REGEX, {
    message:
      'Họ tên chỉ được chứa chữ cái và khoảng trắng, không có số hoặc ký tự đặc biệt, không có khoảng trắng đầu hoặc cuối và không có khoảng trắng liên tiếp',
  })
  fullname: string;

  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @Matches(PHONE_REGEX, {
    message: 'Số điện thoại không hợp lệ',
  })
  phone_number: string;

  @IsString({ message: 'Địa chỉ phải là 1 chuỗi' })
  address: string;
}
