import { Expose, Type } from 'class-transformer';
import { DoctorSlotResponseDto } from 'src/modules/doctor_slots/dto/response-doctor_slot.dto';
import { SpecialtyResponseDto } from 'src/modules/specialties/dto/response-specialty.dto';
import { WorkScheduleResponseDto } from 'src/modules/work_schedules/dto/response-work_schedule.dto';

export class DoctorResponseDto {
  @Expose()
  doctor_id: number;

  @Expose()
  fullname: string;

  @Expose()
  gender: string;

  @Expose()
  degree: string;

  @Expose()
  position: string;

  @Expose()
  description: string;

  @Expose()
  years_of_experience: number;

  @Expose()
  phone_number: string;

  @Expose()
  email: string;

  @Expose()
  avatar_url: string;

  @Expose()
  createdAt: Date;

  @Expose()
  @Type(() => SpecialtyResponseDto)
  specialization: SpecialtyResponseDto;

  @Expose()
  @Type(() => WorkScheduleResponseDto)
  work_schedules: WorkScheduleResponseDto[];

  @Expose()
  @Type(() => DoctorSlotResponseDto)
  doctor_slots: DoctorSlotResponseDto[];
}
