import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { CancellationParty, ReasonCode } from 'src/modules/appointments/enum';

export class CancellationAppointmentDto {
  @IsNotEmpty({ message: 'Thông tin bên hủy lịch khám không được để trống' })
  @IsEnum(CancellationParty, {
    message: 'Thông tin bên hủy lịch khám không đúng định dạng',
  })
  cancellation_party: CancellationParty;

  @IsNotEmpty({ message: 'Mã lý do hủy không được để trống' })
  @IsEnum(ReasonCode, {
    message: 'Mã lý do hủy không đúng định dạng',
  })
  reason_code: ReasonCode;

  @IsString({ message: 'Ghi chú phải là  dạng chuỗi' })
  note: string;
}
