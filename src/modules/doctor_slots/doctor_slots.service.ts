import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateDoctorSlotDto } from './dto/create-doctor_slot.dto';
import { UpdateDoctorSlotDto } from './dto/update-doctor_slot.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DoctorSlot } from 'src/modules/doctor_slots/entities/doctor_slot.entity';
import {
  In,
  IsNull,
  LessThanOrEqual,
  MoreThanOrEqual,
  Not,
  Repository,
} from 'typeorm';
import { ERROR_MESSAGE } from 'src/common/constants/exception.message';
import { WorkSlot } from 'src/modules/work_schedules/type';
import { WorkSchedule } from 'src/modules/work_schedules/entities/work_schedule.entity';
import { SourceType, StatusDoctorSlot } from 'src/modules/doctor_slots/enum';
import moment from 'moment';

@Injectable()
export class DoctorSlotsService {
  constructor(
    @InjectRepository(DoctorSlot)
    private readonly doctorSlotRepo: Repository<DoctorSlot>,

    @InjectRepository(WorkSchedule)
    private readonly workScheduleRepo: Repository<WorkSchedule>,
  ) {}
  private readonly NOON_BREAK_START = 12 * 60; // 12:00
  private readonly NOON_BREAK_END = 13 * 60 + 30; // 13:30

  async create(createDoctorSlotDto: CreateDoctorSlotDto) {
    const { doctor_id, from_date, to_date, is_new } = createDoctorSlotDto;
    const fromDate = moment(from_date, 'DD/MM/YYYY');
    const toDate = moment(to_date, 'DD/MM/YYYY');

    // lấy thông tin lịch làm việc của bác sĩ theo id bác sĩ
    let workSchedulesByDoctor: WorkSchedule[] = [];
    if (!is_new) {
      // lấy các lịch làm việc cũ với điều kiện: ngày hiện tại lớn hơn hoặc bằng ngày có hiệu lực cũ và ngày gia hạn làm việc cũ phải lớn hơn hoặc bằng toDate
      workSchedulesByDoctor = await this.workScheduleRepo.find({
        where: {
          effective_date: LessThanOrEqual(new Date()),
          expire_date: MoreThanOrEqual(toDate.toDate()),
        },
      });
    } else {
      // Lấy các lịch làm việc mới với điều kiện: ngày có hiệu lực mới >= ngày hiện tại và ngày gia hạn bằng null
      workSchedulesByDoctor = await this.workScheduleRepo.find({
        where: {
          effective_date: MoreThanOrEqual(new Date()),
          expire_date: IsNull(),
        },
      });
    }

    if (workSchedulesByDoctor.length < 1)
      throw new BadRequestException(
        ERROR_MESSAGE.WORK_SCHEDULE_NOT_FOUND_STRING,
      );

    const filterDate = workSchedulesByDoctor.flatMap((w) =>
      this.getDatesInRange(fromDate, toDate, w.day_of_week),
    );

    if (filterDate.length < 1) {
      throw new BadRequestException(
        ERROR_MESSAGE.WORK_SCHEDULE_NOT_FOUND_STRING,
      );
    }

    // kiểm tra ngày làm việc đã được tạo slot hay chưa
    const checkSlotHasBeenCreate = await this.doctorSlotRepo.count({
      where: {
        slot_date: In(filterDate),
        doctor: {
          doctor_id,
        },
      },
    });
    if (checkSlotHasBeenCreate > 0)
      throw new ConflictException(
        ERROR_MESSAGE.WORK_SCHEDULE_HAS_BEEN_CREATE_SLOT,
      );

    // --- Chia lịch khám thành slots ---
    let listSlotsToInsertIntoDB: DoctorSlot[] = [];
    for (const {
      start_time,
      end_time,
      slot_duration,
      day_of_week,
      schedule_id,
    } of workSchedulesByDoctor) {
      const slots = this.splitSchedule(start_time, end_time, slot_duration);
      const datesForThisSchedule = this.getDatesInRange(
        fromDate,
        toDate,
        day_of_week,
      );

      for (const date of datesForThisSchedule) {
        for (const { start, end } of slots) {
          listSlotsToInsertIntoDB.push(
            this.doctorSlotRepo.create({
              start_at: start,
              end_at: end,
              status: StatusDoctorSlot.AVAILABLE,
              doctor: { doctor_id },
              slot_date: date,
              source_type: SourceType.work_schedule,
              source_id: schedule_id,
            }),
          );
        }
      }
    }
    await this.doctorSlotRepo.save(listSlotsToInsertIntoDB);
    return listSlotsToInsertIntoDB;
  }

  // hàm cập nhật trạng thái ca khám
  async update(id: number, updateDoctorSlotDto: UpdateDoctorSlotDto) {
    const { status } = updateDoctorSlotDto;

    //  kiểm tra slot tồn tại
    const slot = await this.doctorSlotRepo.findOne({
      where: {
        slot_id: id,
      },
    });
    if (!slot) throw new NotFoundException(ERROR_MESSAGE.DOCTOR_SLOT_NOT_FOUND);
    slot.status = status;
    await this.doctorSlotRepo.save(slot);
  }

  // Convert số phút -> "HH:mm"
  private minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  // Convert "HH:mm" -> số phút
  private timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  // Sinh slots theo slotDuration
  private generateSlots(
    start: string,
    end: string,
    slotDuration: number,
  ): WorkSlot[] {
    const slots: WorkSlot[] = [];
    let current = this.timeToMinutes(start);
    const endMinutes = this.timeToMinutes(end);

    while (current + slotDuration <= endMinutes) {
      slots.push({
        start: this.minutesToTime(current),
        end: this.minutesToTime(current + slotDuration),
      });
      current += slotDuration;
    }

    return slots;
  }

  // Hàm chính: chia ca
  private splitSchedule(
    start: string,
    end: string,
    slotDuration: number,
  ): WorkSlot[] {
    const startMinutes = this.timeToMinutes(start);
    const endMinutes = this.timeToMinutes(end);

    // kiểm tra thời gian làm việc của ngày làm việc có quá giờ trưa không
    const crossesNoonBreak =
      startMinutes < this.NOON_BREAK_START && endMinutes > this.NOON_BREAK_END;

    const slots: WorkSlot[] = [];

    if (crossesNoonBreak) {
      // Ca sáng (nếu bắt đầu trước giờ nghỉ trưa)
      if (startMinutes < this.NOON_BREAK_START) {
        slots.push(
          ...this.generateSlots(
            this.minutesToTime(startMinutes),
            this.minutesToTime(this.NOON_BREAK_START),
            slotDuration,
          ),
        );
      }

      // Ca chiều (nếu kết thúc sau giờ nghỉ trưa)
      if (endMinutes > this.NOON_BREAK_END) {
        slots.push(
          ...this.generateSlots(
            this.minutesToTime(this.NOON_BREAK_END),
            this.minutesToTime(endMinutes),
            slotDuration,
          ),
        );
      }
    } else {
      // Không cắt ngang giờ trưa → chia bình thường
      slots.push(...this.generateSlots(start, end, slotDuration));
    }

    return slots;
  }

  // hàm tính ngày gần nhất cho 1 thứ trong tuần
  private getDatesInRange(
    fromDate: moment.Moment,
    toDate: moment.Moment,
    weekday: string,
  ) {
    let current = fromDate.clone();
    const dates: string[] = [];

    while (current.isSameOrBefore(toDate, 'day')) {
      if (weekday.includes(current.format('dddd'))) {
        dates.push(current.format('DD/MM/YYYY'));
        // return current.format('DD/MM/YYYY');
      }
      current.add(1, 'day');
    }
    return dates;
  }
}
