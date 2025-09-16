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
import { DayOfWeek } from 'src/modules/work_schedules/enum';

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
    const { doctor_id, schedules } = createDoctorSlotDto;

    // --- B1: Kiểm tra schedule_id trùng lặp trong input ---
    const scheduleIds = schedules.map((s) => s.schedule_id);
    const scheduleIdsUnique = new Set<string>(scheduleIds);
    if (scheduleIdsUnique.size < scheduleIds.length) {
      throw new BadRequestException(ERROR_MESSAGE.INVALID_INPUT);
    }

    // --- B2: Lấy schedules từ DB ---
    const schedulesFromDB = await this.workScheduleRepo.find({
      where: { schedule_id: In(scheduleIds) },
      relations: ['doctor'], // cần để check đúng bác sĩ
    });

    // Nếu thiếu schedule
    if (schedulesFromDB.length < scheduleIds.length) {
      throw new NotFoundException(ERROR_MESSAGE.WORK_SCHEDULE_NOT_FOUND_STRING);
    }
    // console.log('schedulesFromDB::', schedulesFromDB);

    // --- B3: Kiểm tra schedule có thuộc đúng doctor ---
    for (const s of schedulesFromDB) {
      if (s.doctor.doctor_id !== doctor_id) {
        throw new BadRequestException(
          `Lịch làm việc ID=${s.schedule_id} không thuộc về bác sĩ này`,
        );
      }
    }

    // --- B4: Kiểm tra schedule đã được chia slot trước đó chưa ---
    const exists = await this.doctorSlotRepo.find({
      where: { work_schedule: { schedule_id: In(scheduleIds) } },
      relations: {
        work_schedule: true,
      },
      select: ['work_schedule'],
    });

    if (exists.length > 0) {
      const duplicatedIds = new Set<string>(
        exists.map((e) => DayOfWeek[e.work_schedule['day_of_week'].toString()]),
      );

      throw new BadRequestException(
        `Các lịch làm việc sau đã có ca khám rồi: ${Array.from(duplicatedIds).join(', ')}`,
      );
    }

    // --- B5: Chia lịch khám thành slots ---
    let listSlotsToInsertIntoDB: DoctorSlot[] = [];
    for (const {
      schedule_id,
      start_time,
      end_time,
      slot_duration,
    } of schedulesFromDB) {
      const slots = this.splitSchedule(start_time, end_time, slot_duration);
      for (const { start, end } of slots) {
        listSlotsToInsertIntoDB.push(
          this.doctorSlotRepo.create({
            work_schedule: { schedule_id },
            start_at: start,
            end_at: end,
            status: StatusDoctorSlot.AVAILABLE,
            doctor: { doctor_id },
          }),
        );
      }

      // --- B6: Lưu vào DB ---
      await this.doctorSlotRepo.save(listSlotsToInsertIntoDB);
    }
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
}
