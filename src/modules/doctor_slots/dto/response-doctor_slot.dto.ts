import { Expose, Type } from 'class-transformer';
import { AppointmentResponseDto } from 'src/modules/appointments/dto/response-appointment.dto';

export class DoctorSlotResponseDto {
  @Expose()
  slot_id: number;

  @Expose()
  start_at: string;

  @Expose()
  end_at: string;

  @Expose()
  status: string;

  @Expose()
  createdAt: Date;

  @Expose()
  @Type(() => AppointmentResponseDto)
  appointment: AppointmentResponseDto;
}
