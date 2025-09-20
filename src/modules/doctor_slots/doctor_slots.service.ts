import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateDoctorSlotDto } from './dto/create-doctor_slot.dto';
import { UpdateDoctorSlotDto } from './dto/update-doctor_slot.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DoctorSlot } from 'src/modules/doctor_slots/entities/doctor_slot.entity';
import { In, Repository } from 'typeorm';
import { ERROR_MESSAGE } from 'src/common/constants/exception.message';
import { WorkSlot } from 'src/modules/work_schedules/type';
import { WorkSchedule } from 'src/modules/work_schedules/entities/work_schedule.entity';
import { StatusDoctorSlot } from 'src/modules/doctor_slots/enum';
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
    const { doctor_id, from_date, to_date } = createDoctorSlotDto;

    // lấy thông tin lịch làm việc của bác sĩ theo id bác sĩ
    const workScheduleByDoctor = await this.workScheduleRepo.find({
      where: {
        doctor: {
          doctor_id,
        },
      },
    });

    if (workScheduleByDoctor.length < 1)
      throw new BadRequestException(
        ERROR_MESSAGE.WORK_SCHEDULE_NOT_FOUND_STRING,
      );

    const fromDate = moment(from_date, 'DD/MM/YYYY');
    const toDate = moment(to_date, 'DD/MM/YYYY');
    const filterDate = workScheduleByDoctor.flatMap((w) =>
      this.getDatesInRange(fromDate, toDate, w.day_of_week),
    );

    if (filterDate.length < 1) {
      throw new BadRequestException(
        ERROR_MESSAGE.WORK_SCHEDULE_NOT_FOUND_STRING,
      );
    }

    // --- Chia lịch khám thành slots ---
    let listSlotsToInsertIntoDB: DoctorSlot[] = [];
    for (const {
      start_time,
      end_time,
      slot_duration,
      day_of_week,
    } of workScheduleByDoctor) {
      const slots = this.splitSchedule(start_time, end_time, slot_duration);
      // Lấy tất cả ngày khớp với day_of_week trong khoảng fromDate..toDate
      const validDates = this.getDatesInRange(fromDate, toDate, day_of_week);

      for (const date of validDates) {
        for (const { start, end } of slots) {
          listSlotsToInsertIntoDB.push(
            this.doctorSlotRepo.create({
              start_at: start,
              end_at: end,
              status: StatusDoctorSlot.AVAILABLE,
              doctor: { doctor_id },
              slot_date: date,
            }),
          );
        }
      }
    }

    // -- kiểm tra trùng slot trong db trước khi insert --
    const weekdaysInsertUnique = new Set<string>(
      listSlotsToInsertIntoDB.map((s) => s.slot_date),
    );
    const slotFromDB = await this.doctorSlotRepo.find({
      where: {
        slot_date: In([...weekdaysInsertUnique]),
        doctor: {
          doctor_id,
        },
      },
    });

    let listInvalidSlot: DoctorSlot[] = [];
    for (const slotInsert of listSlotsToInsertIntoDB) {
      for (const slotDB of slotFromDB) {
        if (slotInsert.slot_date === slotDB.slot_date) {
          // chuyển thời gian về đúng định dạng để so sánh
          const insertStart = moment(slotInsert.start_at, 'HH:mm:ss');
          const insertEnd = moment(slotInsert.end_at, 'HH:mm:ss');
          const dbStart = moment(slotDB.start_at, 'HH:mm:ss');
          const dbEnd = moment(slotDB.end_at, 'HH:mm:ss');

          if (insertStart.isBefore(dbEnd) && insertEnd.isAfter(dbStart)) {
            listInvalidSlot.push(slotInsert);
          }
        }
      }
    }

    if (listInvalidSlot.length > 0) {
      throw new BadRequestException(ERROR_MESSAGE.SLOT_EXISTS);
    }

    await this.doctorSlotRepo.save(listSlotsToInsertIntoDB);
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

  remove(id: number) {
    return `This action removes a #${id} doctorSlot`;
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
