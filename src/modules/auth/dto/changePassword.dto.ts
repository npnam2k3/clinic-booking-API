import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PASSWORD_REGEX } from 'src/modules/auth/regex';

export class ChangePasswordDTO {
  @IsString({ message: 'Mật khẩu phải là 1 chuỗi' })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  current_password: string;

  @IsString({ message: 'Mật khẩu mới phải là 1 chuỗi' })
  @IsNotEmpty({ message: 'Mật khẩu mới không được để trống' })
  @MinLength(6, { message: 'Mật khẩu mới phải có ít nhất 6 ký tự' })
  @MaxLength(30, { message: 'Mật khẩu mới không được quá 30 ký tự' })
  @Matches(PASSWORD_REGEX, {
    message:
      'Mật khẩu mới phải có ít nhất 1 chữ hoa, 3 chữ thường, 1 số, 1 ký tự đặc biệt và không chứa khoảng trắng và không dấu',
  })
  new_password: string;

  @IsString({ message: 'Mật khẩu xác nhận phải là 1 chuỗi' })
  @IsNotEmpty({ message: 'Mật khẩu xác nhận không được để trống' })
  confirm_password: string;
}
