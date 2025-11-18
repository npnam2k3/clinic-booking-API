import { Injectable } from '@nestjs/common';
import moment from 'moment';
import { Appointment } from 'src/modules/appointments/entities/appointment.entity';
import { StatusAppointment } from 'src/modules/appointments/enum';
import { Doctor } from 'src/modules/doctors/entities/doctor.entity';
import { Patient } from 'src/modules/patients/entities/patient.entity';
import { DataSource } from 'typeorm';

@Injectable()
export class DashboardService {
  constructor(private readonly dataSource: DataSource) {}
  // lấy thông số cơ bản: số lượng lịch khám hôm nay, số lượng lịch bị hủy, số lượng bác sĩ hiện tại, số lượng bệnh nhân hiện tại
  async getBasicStatistic() {
    const appointmentRepo = this.dataSource.getRepository(Appointment);
    const doctorRepo = this.dataSource.getRepository(Doctor);
    const patientRepo = this.dataSource.getRepository(Patient);

    const today = new Date();

    const countAppointmentsToday = await appointmentRepo
      .createQueryBuilder('a')
      .where('DATE(a.createdAt) = DATE(:today)', { today })
      .andWhere('a.status IN (:...statuses)', {
        statuses: [StatusAppointment.PENDING, StatusAppointment.CONFIRMED],
      })
      .getCount();

    const countAppointmentsCancelled = await appointmentRepo
      .createQueryBuilder('a')
      .where('DATE(a.createdAt) = DATE(:today)', { today })
      .andWhere('a.status = :status', { status: StatusAppointment.CANCELED })
      .getCount();

    const countDoctors = await doctorRepo.count();
    const countPatients = await patientRepo.count();

    return {
      appointments_today: countAppointmentsToday,
      appointments_cancelled: countAppointmentsCancelled,
      total_doctors: countDoctors,
      total_patients: countPatients,
    };
  }

  // hàm lấy dữ liệu cho biểu đồ thống kê số lượng lịch khám được đặt trong tuần
  async getWeeklyAppointmentStatistic() {
    const appointmentRepo = this.dataSource.getRepository(Appointment);

    // Lấy thứ trong tuần hiện tại (T2 -> CN)
    const startOfWeek = moment().startOf('isoWeek').toDate(); // Thứ 2
    const endOfWeek = moment().endOf('isoWeek').toDate(); // Chủ nhật

    // Lấy tất cả lịch trong tuần
    const appointments = await appointmentRepo
      .createQueryBuilder('a')
      .select(['DATE(a.createdAt) as date', 'COUNT(*) as count'])
      .where('a.createdAt BETWEEN :start AND :end', {
        start: startOfWeek,
        end: endOfWeek,
      })
      .andWhere('a.status IN (:...statuses)', {
        statuses: [
          StatusAppointment.PENDING,
          StatusAppointment.CONFIRMED,
          StatusAppointment.COMPLETED,
        ],
      })
      .groupBy('DATE(a.createdAt)')
      .orderBy('DATE(a.createdAt)', 'ASC')
      .getRawMany();

    // Tạo danh sách 7 ngày trong tuần
    const weekDays = [
      { key: 1, day: 'T2' },
      { key: 2, day: 'T3' },
      { key: 3, day: 'T4' },
      { key: 4, day: 'T5' },
      { key: 5, day: 'T6' },
      { key: 6, day: 'T7' },
      { key: 7, day: 'CN' },
    ];

    // Gộp dữ liệu thống kê với danh sách 7 ngày
    const weeklyAppointments = weekDays.map((d) => {
      const dateOfDay = moment(startOfWeek)
        .add(d.key - 1, 'days')
        .format('YYYY-MM-DD');
      const found = appointments.find(
        (item) => moment(item.date).format('YYYY-MM-DD') === dateOfDay,
      );
      return {
        day: d.day,
        count: found ? Number(found.count) : 0,
      };
    });

    return { weeklyAppointments };
  }

  // hàm lấy danh sách các lịch khám sắp tới (trong vòng 2 ngày gần nhất)
  async getUpcomingAppointments() {
    const today = moment().startOf('day').format('DD/MM/YYYY');
    const next2Days = moment().add(2, 'days').endOf('day').format('DD/MM/YYYY');

    const appointments = await this.dataSource
      .getRepository(Appointment)
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.doctor_slot', 'slot')
      .leftJoinAndSelect('a.patient', 'patient')
      .leftJoinAndSelect('slot.doctor', 'doctor')
      .where(
        `STR_TO_DATE(slot.slot_date, "%d/%m/%Y") BETWEEN
       STR_TO_DATE(:today, "%d/%m/%Y") AND STR_TO_DATE(:next2Days, "%d/%m/%Y")`,
        { today, next2Days },
      )
      .andWhere('a.status IN (:...statuses)', {
        statuses: [StatusAppointment.PENDING, StatusAppointment.CONFIRMED],
      })
      .orderBy('STR_TO_DATE(slot.slot_date, "%d/%m/%Y")', 'ASC')
      .addOrderBy('slot.start_at', 'ASC')
      .getMany();

    // format dữ liệu hiển thị
    const result = appointments.map((a, index) => ({
      index: index + 1,
      patient_name: a.patient?.fullname || 'N/A',
      doctor_name: a.doctor_slot?.doctor?.fullname || 'N/A',
      slot_date: a.doctor_slot?.slot_date,
      start_at: a.doctor_slot?.start_at,
      status: a.status,
    }));

    return result;
  }
}
