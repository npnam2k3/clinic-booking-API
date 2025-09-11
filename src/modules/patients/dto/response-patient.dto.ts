import { Expose, Type } from 'class-transformer';
import { AppointmentResponseDto } from 'src/modules/appointments/dto/response-appointment.dto';
import { ContactResponseDTO } from 'src/modules/users/dto/response-user.dto';

export class PatientResponseDto {
  @Expose()
  patient_code: string;

  @Expose()
  fullname: string;

  @Expose()
  date_of_birth: string;

  @Expose()
  gender: string;

  @Expose()
  address: string;

  @Expose()
  createdAt: Date;

  @Expose()
  @Type(() => ContactResponseDTO)
  contact: ContactResponseDTO;

  @Expose()
  @Type(() => AppointmentResponseDto)
  appointments: AppointmentResponseDto[];
}
