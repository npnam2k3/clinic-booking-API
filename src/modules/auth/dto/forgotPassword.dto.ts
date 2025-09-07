import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { EMAIL_REGEX } from 'src/modules/auth/regex';

export class ForgotPasswordDTO {
  @Transform(({ value }) =>
    value && typeof value === 'string' ? value?.trim() : value,
  )
  @IsString({ message: 'Email phải là 1 chuỗi' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  @Matches(EMAIL_REGEX, {
    message: 'Email không hợp lệ',
  })
  email: string;
}
