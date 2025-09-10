import { Expose } from 'class-transformer';

export class SpecialtyResponseDto {
  @Expose()
  specialization_id: number;

  @Expose()
  specialization_name: string;

  @Expose()
  description: string;

  @Expose()
  createdAt: Date;
}
