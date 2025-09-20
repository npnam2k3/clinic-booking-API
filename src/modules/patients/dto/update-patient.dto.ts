import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Validate,
} from 'class-validator';
import { IsValidDateConstraint } from 'src/common/utils/validationCustom';
import { FULLNAME_REGEX } from 'src/modules/auth/regex';
import { Gender } from 'src/modules/patients/enum';

export class UpdatePatientDto {
  @IsString({ message: 'Họ tên phải là 1 chuỗi' })
  @IsNotEmpty({ message: 'Họ tên không được để trống' })
  @IsOptional()
  @Matches(FULLNAME_REGEX, {
    message:
      'Họ tên chỉ được chứa chữ cái và khoảng trắng, không có số hoặc ký tự đặc biệt, không có khoảng trắng đầu hoặc cuối và không có khoảng trắng liên tiếp',
  })
  fullname?: string;

  @Validate(IsValidDateConstraint)
  @IsOptional()
  date_of_birth?: string;

  @IsNotEmpty({ message: 'Giới tính không được để trống' })
  @IsOptional()
  @IsEnum(Gender, {
    message: 'Giới tính phải là 1 trong 2 giá trị sau: male hoặc female',
  })
  gender?: Gender;

  @IsOptional()
  @IsString({ message: 'Địa chỉ phải là định dạng chuỗi' })
  address?: string;
}
