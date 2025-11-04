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
    const { doctor_id, schedules, slot_duration, effective_date } =
      createWorkScheduleDto;

    // kiểm tra ngày có hiệu lực của lịch mới phải sau ngày hiện tại
    const today = moment().startOf('day'); // chỉ lấy ngày, bỏ giờ phút giây
    const effectiveDate = moment(effective_date, 'DD/MM/YYYY');

    if (!effectiveDate.isAfter(today)) {
      throw new BadRequestException(
        'Ngày có hiệu lực phải lớn hơn ngày hiện tại',
      );
    }

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

    return await this.dataSource.transaction(async (manager) => {
      // kiểm tra có lịch trong tương lai chưa có hiệu lực
      // Vì chỉ cho phép 1 lịch mới thêm trước. Điều kiện: ngày hiện tại < effective_date và expire_date = null
      const checkExistsWorkScheduleForFuture = await manager.count(
        WorkSchedule,
        {
          where: {
            doctor: { doctor_id },
            effective_date: MoreThan(new Date()),
            expire_date: IsNull(),
          },
        },
      );

      if (checkExistsWorkScheduleForFuture > 0) {
        throw new ConflictException(
          ERROR_MESSAGE.EXISTS_WORK_SCHEDULE_IN_THE_FUTURE,
        );
      }

      // chuẩn bị ngày có hiệu lực và hết hạn
      const effectiveDate = moment(effective_date, 'DD/MM/YYYY').toDate();
      const expireDate = moment(effective_date, 'DD/MM/YYYY')
        .subtract(1, 'day')
        .toDate();

      // cập nhật expire_date của các lịch cũ
      await manager
        .createQueryBuilder()
        .update(WorkSchedule)
        .set({ expire_date: expireDate })
        .where('doctor_id = :doctor_id', { doctor_id })
        .andWhere('effective_date <= NOW()')
        .andWhere('expire_date IS NULL')
        .execute();

      // tạo mới lịch
      const newWorkSchedules = schedules.map((day) =>
        manager.create(WorkSchedule, {
          day_of_week: day.day_of_week,
          slot_duration,
          start_time: day.start_time,
          end_time: day.end_time,
          effective_date: effectiveDate,
          expire_date: null,
          note: day.note,
          doctor: { doctor_id: doctorFound.doctor_id },
        }),
      );

      await manager.save(WorkSchedule, newWorkSchedules);

      // chuyển các slot sau ngày làm việc mới có hiệu lực mà trạng thái đang là available => unavailable
      await manager
        .createQueryBuilder()
        .update(DoctorSlot)
        .set({ status: StatusDoctorSlot.UNAVAILABLE })
        .where('doctor_id = :doctor_id', { doctor_id })

        // STR_TO_DATE: dùng để chuyển slot_date từ dạng DD/MM/YYYY sang YYYY/MM/DD để so sánh
        .andWhere('STR_TO_DATE(slot_date, "%d/%m/%Y") > :expireDate', {
          expireDate,
        })
        .andWhere('status = :status', { status: StatusDoctorSlot.AVAILABLE })
        .execute();

      return newWorkSchedules;
    });
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
