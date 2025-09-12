import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateWorkScheduleDto,
  DayWorkDto,
} from './dto/create-work_schedule.dto';
import { UpdateWorkScheduleDto } from './dto/update-work_schedule.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { WorkSchedule } from 'src/modules/work_schedules/entities/work_schedule.entity';
import { In, Repository } from 'typeorm';
import { ERROR_MESSAGE } from 'src/common/constants/exception.message';
import { DayOfWeek } from 'src/modules/work_schedules/enum';
import { Doctor } from 'src/modules/doctors/entities/doctor.entity';

@Injectable()
export class WorkSchedulesService {
  constructor(
    @InjectRepository(WorkSchedule)
    private readonly workScheduleRepo: Repository<WorkSchedule>,

    @InjectRepository(Doctor)
    private readonly doctorRepo: Repository<Doctor>,
  ) {}
  async create(createWorkScheduleDto: CreateWorkScheduleDto) {
    const { doctor_id, schedules, slot_duration } = createWorkScheduleDto;
    // kiểm tra end_time phải sau start_time
    // chỉ cho phép khoảng thời gian trong vòng 1 ngày, không được tính ngày hôm sau
    // nghĩa là từ 00:00 - 23:59
    this.validateWorkScheduleTimes(schedules);

    // kiểm tra bác sĩ tồn tại theo id
    const doctorFound = await this.doctorRepo.findOne({
      where: {
        doctor_id,
      },
    });
    if (!doctorFound)
      throw new NotFoundException(ERROR_MESSAGE.DOCTOR_NOT_FOUND);

    // kiểm tra ngày làm việc của bác sĩ theo id đã tồn tại hay chưa
    await this.validateScheduleConflict(doctorFound, schedules);

    let newWorkSchedules: WorkSchedule[] = schedules.map((day) => {
      return this.workScheduleRepo.create({
        day_of_week: day.day_of_week,
        slot_duration,
        start_time: day.start_time,
        end_time: day.end_time,
        note: day.note,
        doctor: {
          doctor_id: doctorFound.doctor_id,
        },
      });
    });

    await this.workScheduleRepo.save(newWorkSchedules);
    return newWorkSchedules;
  }

  update(id: number, updateWorkScheduleDto: UpdateWorkScheduleDto) {
    return `This action updates a #${id} workSchedule`;
  }

  remove(id: number) {
    return `This action removes a #${id} workSchedule`;
  }

  // hàm kiểm tra thời gian hợp lệ start_time < end_time
  private checkTimeValid = (start_time: string, end_time: string): boolean => {
    const [sh, sm] = start_time.split(':').map(Number);
    const [eh, em] = end_time.split(':').map(Number);

    const start_minutes = sh * 60 + sm;
    const end_minutes = eh * 60 + em;

    return start_minutes < end_minutes;
  };

  // hàm kiểm tra thời gian của các ngày xem có hợp lệ hay không và kiểm tra xem có ngày làm việc nào bị trùng không
  private validateWorkScheduleTimes(schedules: DayWorkDto[]): void {
    // những ngày đã xuất hiện
    const seenDays = new Set<string>();
    const daysDuplicated = new Set<string>();
    const daysInvalid = new Set<string>();

    for (const { day_of_week, start_time, end_time } of schedules) {
      // check start < end
      if (!this.checkTimeValid(start_time, end_time)) {
        daysInvalid.add(day_of_week);
      }

      // check duplicate day
      if (seenDays.has(day_of_week)) {
        daysDuplicated.add(day_of_week);
      }
      seenDays.add(day_of_week);
    }

    let errors = {};
    if (daysInvalid.size > 0) {
      const daysString = [...daysInvalid] // chuyển từ set thành mảng
        .map((day) => DayOfWeek[day])
        .join(', ');

      errors['dayInvalid'] =
        ERROR_MESSAGE.WORK_SCHEDULE_TIME_INVALID(daysString);
    }
    if (daysDuplicated.size > 0) {
      const daysDuplicatedString = [...daysDuplicated] // chuyển từ set thành mảng
        .map((day) => DayOfWeek[day])
        .join(', ');
      errors['dayDuplicated'] =
        ERROR_MESSAGE.DUPLICATED_WORK_SCHEDULE(daysDuplicatedString);
    }

    if (Object.keys(errors).length > 0)
      throw new BadRequestException({
        errors,
        message: 'Dữ liệu đầu vào không hợp lệ',
      });
  }

  // hàm kiểm tra ngày làm việc đã tồn tại trong database hay chưa
  private async validateScheduleConflict(
    doctor: Doctor,
    schedules: DayWorkDto[],
  ) {
    // lấy tất cả ngày bác sĩ đã có trong DB
    const existingSchedules = await this.workScheduleRepo.find({
      where: { doctor: { doctor_id: doctor.doctor_id } },
      select: ['day_of_week'],
    });

    const existingDays = new Set(existingSchedules.map((s) => s.day_of_week));

    const duplicatedWithDb: string[] = [];
    for (const { day_of_week } of schedules) {
      if (existingDays.has(day_of_week)) {
        duplicatedWithDb.push(day_of_week);
      }
    }

    if (duplicatedWithDb.length > 0) {
      const daysString = duplicatedWithDb.map((d) => DayOfWeek[d]).join(', ');
      throw new BadRequestException(
        ERROR_MESSAGE.WORK_SCHEDULE_EXISTS_IN_DB(daysString, doctor.fullname),
      );
    }
  }
}
