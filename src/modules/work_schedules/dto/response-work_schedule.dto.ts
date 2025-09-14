import { Expose, Type } from 'class-transformer';
import { DoctorSlotResponseDto } from 'src/modules/doctor_slots/dto/response-doctor_slot.dto';

export class WorkScheduleResponseDto {
  @Expose()
  schedule_id: number;

  @Expose()
  day_of_week: string;

  @Expose()
  start_time: string;

  @Expose()
  end_time: string;

  @Expose()
  slot_duration: number;

  @Expose()
  note: string;

  @Expose()
  createdAt: Date;

  @Expose()
  @Type(() => DoctorSlotResponseDto)
  doctor_slots: DoctorSlotResponseDto[];
}
