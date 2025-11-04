import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateWorkScheduleDto,
  DayWorkDto,
} from './dto/create-work_schedule.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { WorkSchedule } from 'src/modules/work_schedules/entities/work_schedule.entity';
import { DataSource, IsNull, MoreThan, Repository } from 'typeorm';
import { ERROR_MESSAGE } from 'src/common/constants/exception.message';
import { DayOfWeek, StatusWorkSchedule } from 'src/modules/work_schedules/enum';
import { Doctor } from 'src/modules/doctors/entities/doctor.entity';
import { checkTimeValid } from 'src/common/utils/handleTime';
import moment from 'moment';
import { DoctorSlot } from 'src/modules/doctor_slots/entities/doctor_slot.entity';
import { StatusDoctorSlot } from 'src/modules/doctor_slots/enum';

@Injectable()
export class WorkSchedulesService {
  constructor(
    @InjectRepository(WorkSchedule)
    private readonly workScheduleRepo: Repository<WorkSchedule>,

    @InjectRepository(Doctor)
    private readonly doctorRepo: Repository<Doctor>,

    private readonly dataSource: DataSource,
  ) {}

  async create(createWorkScheduleDto: CreateWorkScheduleDto) {
    const { doctor_id, schedules, slot_duration, effective_date, expire_date } =
      createWorkScheduleDto;

    // ---- 1 Chuẩn hoá ngày (so sánh theo ngày, bỏ giờ phút giây) ----
    const today = moment().startOf('day');
    const effectiveDate = moment(effective_date, 'DD/MM/YYYY').startOf('day');
    const expireDate = moment(expire_date, 'DD/MM/YYYY').startOf('day');

    // ---- 2 Kiểm tra ngày hợp lệ ----
    if (!effectiveDate.isAfter(today)) {
      throw new BadRequestException(
        'Ngày có hiệu lực phải lớn hơn ngày hiện tại',
      );
    }

    if (!expireDate.isAfter(effectiveDate)) {
      throw new BadRequestException(
        'Ngày hết hạn phải lớn hơn ngày có hiệu lực',
      );
    }

    const diffDays = expireDate.diff(effectiveDate, 'days');
    if (diffDays < 7) {
      throw new BadRequestException(
        'Lịch làm việc phải có thời hạn tối thiểu 7 ngày',
      );
    }

    // ---- 3 Kiểm tra thời gian trong schedule ----
    this.validateWorkScheduleTimes(schedules);

    // ---- 4 Kiểm tra bác sĩ tồn tại ----
    const doctorFound = await this.doctorRepo.findOne({
      where: { doctor_id },
    });

    if (!doctorFound)
      throw new NotFoundException(ERROR_MESSAGE.DOCTOR_NOT_FOUND);

    // ---- 5 Tìm lịch hiện tại đang sử dụng ----
    const currentWorkSchedule = await this.dataSource
      .getRepository(WorkSchedule)
      .createQueryBuilder('ws')
      .where('ws.doctor_id = :doctor_id', { doctor_id })
      .andWhere('DATE(ws.effective_date) <= CURDATE()')
      .andWhere('CURDATE() <= DATE(ws.expire_date)')
      .getOne();

    // ---- 6 Kiểm tra trùng lịch với lịch hiện tại ----
    if (currentWorkSchedule) {
      const currentExpire = moment(currentWorkSchedule.expire_date).startOf(
        'day',
      );
      if (!effectiveDate.isAfter(currentExpire)) {
        throw new ConflictException(
          'Lịch mới phải bắt đầu sau khi lịch hiện tại hết hạn',
        );
      }
    }

    // ---- 7 Kiểm tra đã có lịch mới trong tương lai chưa ----
    const hasFutureSchedule = await this.dataSource
      .getRepository(WorkSchedule)
      .createQueryBuilder('ws')
      .where('ws.doctor_id = :doctor_id', { doctor_id })
      .andWhere('DATE(ws.effective_date) > CURDATE()')
      .getExists();

    if (hasFutureSchedule) {
      throw new ConflictException(
        ERROR_MESSAGE.EXISTS_WORK_SCHEDULE_IN_THE_FUTURE,
      );
    }

    // ---- 8 Lưu lịch mới ----
    const newSchedules = schedules.map((day) =>
      this.dataSource.getRepository(WorkSchedule).create({
        doctor: { doctor_id },
        day_of_week: day.day_of_week,
        slot_duration,
        start_time: day.start_time,
        end_time: day.end_time,
        effective_date: effectiveDate.toDate(),
        expire_date: expireDate.toDate(),
        note: day.note,
      }),
    );

    await this.dataSource.getRepository(WorkSchedule).save(newSchedules);

    return newSchedules;
  }

  // lấy lịch làm việc cũ của từng bác sĩ => hiển thị theo danh sách bác sĩ
  async getOldWorkSchedule() {
    // câu lệnh truy vấn vào DB
    const listDoctors = await this.dataSource
      .getRepository(Doctor)
      .createQueryBuilder('doctor')
      .leftJoinAndSelect(
        'doctor.work_schedules',
        'work_schedule',
        `
          DATE(work_schedule.effective_date) <= CURDATE()
          AND DATE(work_schedule.expire_date) >= CURDATE()
        `,
      )
      .orderBy('doctor.doctor_id', 'ASC')
      .getMany();

    // format kết quả trả về có gắn thêm status vào mỗi schedule
    const result = listDoctors.map((doctor) => ({
      ...doctor,
      work_schedules: doctor.work_schedules.map((w) => ({
        ...w,
        status: StatusWorkSchedule.active,
      })),
    }));
    return result;
  }

  // lấy lịch làm việc mới của từng bác sĩ => hiển thị theo danh sách bác sĩ
  async getNewWorkSchedule() {
    // truy vấn vào DB
    const listDoctors = await this.dataSource
      .getRepository(Doctor)
      .createQueryBuilder('doctor')
      .leftJoinAndSelect(
        'doctor.work_schedules',
        'work_schedule',
        'DATE(work_schedule.effective_date) > CURDATE()',
      )
      .orderBy('doctor.doctor_id', 'ASC')
      .getMany();

    // format kết quả trả về có gắn thêm status vào mỗi schedule
    const result = listDoctors.map((doctor) => ({
      ...doctor,
      work_schedules: doctor.work_schedules.map((w) => ({
        ...w,
        status: StatusWorkSchedule.coming_up,
      })),
    }));

    return result;
  }

  // hàm kiểm tra thời gian của các ngày xem có hợp lệ hay không và kiểm tra xem có ngày làm việc nào bị trùng không
  private validateWorkScheduleTimes(schedules: DayWorkDto[]): void {
    // những ngày đã xuất hiện
    const seenDays = new Set<string>();
    const daysDuplicated = new Set<string>();
    const daysInvalid = new Set<string>();

    for (const { day_of_week, start_time, end_time } of schedules) {
      // check start < end
      if (!checkTimeValid(start_time, end_time)) {
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
        message: ERROR_MESSAGE.INVALID_INPUT,
      });
  }
}
