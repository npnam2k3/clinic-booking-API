import { Expose, Type } from 'class-transformer';
import { DoctorResponseDto } from 'src/modules/doctors/dto/doctor-response.dto';
import { ContactResponseDTO } from 'src/modules/users/dto/response-user.dto';

export class ReviewResponseDto {
  @Expose()
  review_id: number;

  @Expose()
  vote: string;

  @Expose()
  comment: string;

  @Expose()
  status: string;

  @Expose()
  createdAt: Date;

  @Expose()
  @Type(() => DoctorResponseDto)
  doctor: DoctorResponseDto;

  @Expose()
  @Type(() => ContactResponseDTO)
  contact: ContactResponseDTO;
}
