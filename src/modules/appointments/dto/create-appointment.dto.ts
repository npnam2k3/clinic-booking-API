import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  Matches,
  Min,
  Validate,
} from 'class-validator';
import { IsValidDateConstraint } from 'src/common/utils/validationCustom';
import { FULLNAME_REGEX, PHONE_REGEX } from 'src/modules/auth/regex';
import { Gender } from 'src/modules/patients/enum';

export class CreateAppointmentDto {
  @IsNumber({}, { message: 'Mã ca khám phải là 1 số' })
  @Min(1, { message: 'Mã ca khám phải lớn hơn 0' })
  slot_id: number;

  @IsString({ message: 'Họ tên người liên hệ phải là 1 chuỗi' })
  @IsNotEmpty({ message: 'Họ tên người liên hệ không được để trống' })
  @Matches(FULLNAME_REGEX, {
    message:
      'Họ tên người liên hệ chỉ được chứa chữ cái và khoảng trắng, không có số hoặc ký tự đặc biệt, không có khoảng trắng đầu hoặc cuối và không có khoảng trắng liên tiếp',
  })
  fullname_contact: string;

  @IsNotEmpty({ message: 'Số điện thoại người liên hệ không được để trống' })
  @Matches(PHONE_REGEX, {
    message: 'Số điện thoại người liên hệ không hợp lệ',
  })
  phone_number: string;

  @IsString({ message: 'Họ tên phải là 1 chuỗi' })
  @IsNotEmpty({ message: 'Họ tên không được để trống' })
  @Matches(FULLNAME_REGEX, {
    message:
      'Họ tên chỉ được chứa chữ cái và khoảng trắng, không có số hoặc ký tự đặc biệt, không có khoảng trắng đầu hoặc cuối và không có khoảng trắng liên tiếp',
  })
  fullname: string;

  @Validate(IsValidDateConstraint)
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
