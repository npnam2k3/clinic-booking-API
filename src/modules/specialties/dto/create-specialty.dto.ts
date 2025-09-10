import { IsNotEmpty, IsString } from 'class-validator';

export class CreateSpecialtyDto {
  @IsNotEmpty({ message: 'Tên chuyên khoa không được trống' })
  specialization_name: string;

  @IsString({ message: 'Mô tả phải là 1 chuỗi' })
  description: string;
}
