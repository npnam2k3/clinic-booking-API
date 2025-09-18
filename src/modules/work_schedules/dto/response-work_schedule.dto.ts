import { Expose } from 'class-transformer';

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
}
