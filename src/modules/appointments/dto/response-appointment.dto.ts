import { Expose, Type } from 'class-transformer';
import { PatientResponseDto } from 'src/modules/patients/dto/response-patient.dto';

export class AppointmentResponseDto {
  @Expose()
  appointment_id: number;

  @Expose()
  appointment_date: Date;

  @Expose()
  status: string;

  @Expose()
  note: string;

  @Expose()
  createdAt: Date;

  @Expose()
  @Type(() => PatientResponseDto)
  patient: PatientResponseDto;
}
