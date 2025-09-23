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
import { DayOfWeek } from 'src/modules/work_schedules/enum';
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

  // async update(doctorId: number, updateWorkScheduleDto: UpdateWorkScheduleDto) {
  //   const { schedules } = updateWorkScheduleDto;
  //   this.validateWorkScheduleTimes(schedules || []);

  //   const doctorFound = await this.doctorRepo.findOne({
  //     where: {
  //       doctor_id: doctorId,
  //     },
  //     relations: {
  //       work_schedules: true,
  //     },
  //   });
  //   // console.log('check doctorFound::', doctorFound);
  //   if (!doctorFound)
  //     throw new NotFoundException(ERROR_MESSAGE.DOCTOR_NOT_FOUND);

  //   await this.validateScheduleConflictForUpdate(doctorFound, schedules || []);

  //   const updatedSchedule = schedules?.map((dto) =>
  //     this.workScheduleRepo.create({
  //       schedule_id: dto.schedule_id,
  //       day_of_week: dto.day_of_week,
  //       start_time: dto.start_time,
  //       end_time: dto.end_time,
  //       note: dto.note,
  //       slot_duration: dto.slot_duration,
  //     }),
  //   ) as WorkSchedule[];
  //   await this.workScheduleRepo.save(updatedSchedule);
  // }

  // async remove(id: number) {
  //   const workScheduleFound = await this.workScheduleRepo.count({
  //     where: {
  //       schedule_id: id,
  //     },
  //   });
  //   if (workScheduleFound < 1) {
  //     throw new NotFoundException(
  //       ERROR_MESSAGE.WORK_SCHEDULE_NOT_FOUND(id.toString()),
  //     );
  //   }
  //   await this.workScheduleRepo.softDelete(id);
  // }

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

  // hàm kiểm tra ngày làm việc đã tồn tại trong database hay chưa
  // private async validateScheduleConflict(
  //   doctor: Doctor,
  //   schedules: DayWorkDto[],
  // ) {
  //   // lấy tất cả ngày làm việc của bác sĩ đã có trong DB
  //   const existingSchedules = await this.workScheduleRepo.find({
  //     where: { doctor: { doctor_id: doctor.doctor_id } },
  //     select: ['day_of_week'],
  //   });

  //   const existingDays = new Set(existingSchedules.map((s) => s.day_of_week));

  //   const duplicatedWithDb: string[] = [];
  //   for (const { day_of_week } of schedules) {
  //     if (existingDays.has(day_of_week)) {
  //       duplicatedWithDb.push(day_of_week);
  //     }
  //   }

  //   if (duplicatedWithDb.length > 0) {
  //     const daysString = duplicatedWithDb.map((d) => DayOfWeek[d]).join(', ');
  //     throw new BadRequestException(
  //       ERROR_MESSAGE.WORK_SCHEDULE_EXISTS_IN_DB(daysString, doctor.fullname),
  //     );
  //   }
  // }

  // private async validateScheduleConflictForUpdate(
  //   doctor: Doctor,
  //   schedules: UpdateDayWorkDto[],
  // ) {
  //   // lấy tất cả ngày làm việc của bác sĩ đã có trong DB
  //   const existingSchedules = await this.workScheduleRepo.find({
  //     where: { doctor: { doctor_id: doctor.doctor_id } },
  //     select: ['schedule_id', 'day_of_week'],
  //   });

  //   const dbScheduleIds = existingSchedules.map((s) => s.schedule_id);

  //   // --- Bước 1: kiểm tra ID tồn tại ---
  //   const invalidIds: number[] = [];
  //   for (const { schedule_id } of schedules) {
  //     if (!dbScheduleIds.includes(schedule_id)) {
  //       invalidIds.push(schedule_id);
  //     }
  //   }

  //   if (invalidIds.length > 0) {
  //     const errors = invalidIds.map((id) =>
  //       ERROR_MESSAGE.WORK_SCHEDULE_NOT_FOUND(id.toString()),
  //     );
  //     throw new BadRequestException({
  //       errors,
  //       message: ERROR_MESSAGE.INVALID_INPUT,
  //     });
  //   }

  //   // --- Bước 2: kiểm tra ngày trùng ---
  //   const errors: string[] = [];
  //   for (const { schedule_id, day_of_week } of schedules) {
  //     const schedulesWithoutCurrentId = existingSchedules.filter(
  //       (s) => s.schedule_id !== schedule_id,
  //     );
  //     const dayOfWeekWithoutCurrent = schedulesWithoutCurrentId.map(
  //       (s) => s.day_of_week,
  //     );

  //     if (dayOfWeekWithoutCurrent.includes(day_of_week)) {
  //       errors.push(
  //         ERROR_MESSAGE.WORK_SCHEDULE_EXISTS_IN_DB(
  //           DayOfWeek[day_of_week],
  //           doctor.fullname,
  //         ),
  //       );
  //     }
  //   }

  //   if (errors.length > 0) {
  //     throw new BadRequestException({
  //       errors,
  //       message: ERROR_MESSAGE.INVALID_INPUT,
  //     });
  //   }
  // }
}
