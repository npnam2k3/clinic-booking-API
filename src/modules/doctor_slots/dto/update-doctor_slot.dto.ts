import { IsIn, IsString, Matches } from 'class-validator';
import { StatusDoctorSlot } from 'src/modules/doctor_slots/enum';
import { REGEX_TIME } from 'src/modules/work_schedules/dto/create-work_schedule.dto';

export class UpdateDoctorSlotDto {
  // @IsString({ message: 'Thời gian bắt đầu phải là 1 chuỗi' })
  // @Matches(REGEX_TIME, {
  //   message: 'Giá trị thời gian bắt đầu phải có dạng HH:mm',
  // })
  // start_time: string;

  // @IsString({ message: 'Thời gian kết thúc phải là 1 chuỗi' })
  // @Matches(REGEX_TIME, {
  //   message: 'Giá trị thời gian kết thúc phải có dạng HH:mm',
  // })
  // end_time: string;

  @IsString({ message: 'Trạng thái phải là 1 chuỗi' })
  @IsIn(['unavailable', 'available', 'booked'], {
    message: 'Giá trị trạng thái không hợp lệ',
  })
  status: StatusDoctorSlot;
}
