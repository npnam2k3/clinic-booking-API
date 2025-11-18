import { InjectRepository } from '@nestjs/typeorm';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { Appointment } from 'src/modules/appointments/entities/appointment.entity';
import { DataSource, Repository } from 'typeorm';
import { Contact } from 'src/modules/users/entities/contact.entity';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DoctorSlot } from 'src/modules/doctor_slots/entities/doctor_slot.entity';
import { StatusDoctorSlot } from 'src/modules/doctor_slots/enum';
import { ERROR_MESSAGE } from 'src/common/constants/exception.message';
import { Patient } from 'src/modules/patients/entities/patient.entity';

import { v4 as uuidv4 } from 'uuid';
import { StatusAppointment } from 'src/modules/appointments/enum';
import { toDTO } from 'src/common/utils/mapToDto';
import { AppointmentResponseDto } from 'src/modules/appointments/dto/response-appointment.dto';
import { CancellationAppointmentDto } from 'src/modules/appointments/dto/cancellation-appointment.dto';
import { AppointmentCancellation } from 'src/modules/appointments/entities/appointment_cancellations.entity';

import moment, { unitOfTime } from 'moment';
import { toLocalTime } from 'src/common/utils/handleTime';
import { MailService } from 'src/common/mail/mail.service';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,

    @InjectRepository(Contact)
    private readonly contactRepo: Repository<Contact>,

    @InjectRepository(DoctorSlot)
    private readonly doctorSlotRepo: Repository<DoctorSlot>,

    private readonly datasource: DataSource,

    private readonly mailService: MailService,
  ) {}
  async create(createAppointmentDto: CreateAppointmentDto) {
    const {
      slot_id,
      phone_number,
      address,
      date_of_birth,
      fullname,
      fullname_contact,
      gender,
      note,
      email,
    } = createAppointmentDto;

    // tạo transaction
    return await this.datasource.transaction(async (manager) => {
      // kiểm tra slot hiện tại đã có ai đặt chưa
      const checkSlotAvailable = await manager.findOne(DoctorSlot, {
        where: {
          slot_id,
          status: StatusDoctorSlot.AVAILABLE,
        },
      });
      if (!checkSlotAvailable)
        throw new BadRequestException(ERROR_MESSAGE.SLOT_UNAVAILABLE);

      // đảm bảo đặt lịch trước 7 ngày
      const isWithinOneWeek = this.isWithinOneWeek(
        checkSlotAvailable.slot_date,
      );
      if (!isWithinOneWeek) {
        throw new BadRequestException(ERROR_MESSAGE.BOOKING_DATE_TOO_FAR);
      }

      // đảm bảo đặt trước ít nhất 2 tiếng lịch khám bắt đầu
      const isAtLeastTwoHours = this.isAtLeastTwoHoursLater(
        checkSlotAvailable.slot_date,
        checkSlotAvailable.start_at,
      );
      if (!isAtLeastTwoHours) {
        throw new BadRequestException(ERROR_MESSAGE.BOOKING_TIME_TOO_SHORT);
      }

      // kiểm tra phone_number trong bảng contact
      const contactFoundByPhoneNumber = await manager.findOne(Contact, {
        where: {
          phone_number,
        },
      });

      let contact: Contact;
      if (contactFoundByPhoneNumber) {
        // nếu có thì gán lại contact
        contact = contactFoundByPhoneNumber;
      } else {
        // nếu không có thì tạo mới và lưu vào bảng contact
        contact = manager.create(Contact, {
          fullname: fullname_contact,
          phone_number: phone_number,
          address,
        });
        await manager.save(Contact, contact);
      }

      // tạo patient mới nếu chưa tồn tại
      let patient = await manager.findOne(Patient, {
        where: {
          fullname: fullname,
          date_of_birth: date_of_birth,
          contact: {
            contact_id: contact.contact_id,
          },
        },
      });
      if (!patient) {
        patient = manager.create(Patient, {
          patient_code: this.generatePatientCode(),
          fullname,
          date_of_birth,
          gender,
          address,
          contact,
        });
        await manager.save(Patient, patient);
      }

      // tạo appointment mới
      const newAppointment = manager.create(Appointment, {
        patient: patient,
        doctor_slot: {
          slot_id,
        },
        note,
        status: StatusAppointment.PENDING,
      });
      await manager.save(Appointment, newAppointment);

      // cập nhật trạng thái slot thành booked
      await manager.update(DoctorSlot, slot_id, {
        status: StatusDoctorSlot.BOOKED,
      });

      // lấy lịch mới đặt
      const appointmentDetail = await manager.findOne(Appointment, {
        where: { appointment_id: newAppointment.appointment_id },
        relations: {
          patient: { contact: true },
          doctor_slot: { doctor: true },
        },
      });

      // gửi mail
      this.mailService.sendAppointmentEmail(appointmentDetail, email);
      return 'Bạn đã đặt lịch thành công. Chúng tôi đã gửi email xác nhận cho bạn. Vui lòng kiểm tra email';
    });
  }

  // hàm xác nhận lịch khám
  async confirm(id: number) {
    // tìm appointment theo id
    const appointmentFound = await this.appointmentRepo.findOne({
      where: {
        appointment_id: id,
      },
    });
    if (!appointmentFound)
      throw new NotFoundException(ERROR_MESSAGE.APPOINTMENT_NOT_FOUND);
    appointmentFound.status = StatusAppointment.CONFIRMED;
    await this.appointmentRepo.save(appointmentFound);
  }

  // hàm hoàn thành lịch khám
  async completed(id: number) {
    // tìm appointment theo id
    const appointmentFound = await this.appointmentRepo.findOne({
      where: {
        appointment_id: id,
      },
    });
    if (!appointmentFound)
      throw new NotFoundException(ERROR_MESSAGE.APPOINTMENT_NOT_FOUND);
    appointmentFound.status = StatusAppointment.COMPLETED;
    await this.appointmentRepo.save(appointmentFound);
  }

  // hàm hủy lịch khám - dành cho phía quản trị
  async cancelByAdmin(
    id: number,
    cancellationAppointmentDto: CancellationAppointmentDto,
    user_id: number,
  ) {
    const { cancellation_party, note, reason_code } =
      cancellationAppointmentDto;
    // tìm theo id
    const appointmentFound = await this.appointmentRepo.findOne({
      where: {
        appointment_id: id,
      },
      relations: {
        doctor_slot: true,
      },
    });
    if (!appointmentFound)
      throw new NotFoundException(ERROR_MESSAGE.APPOINTMENT_NOT_FOUND);

    // nếu đã hủy thì báo lỗi
    if (appointmentFound.status === StatusAppointment.CANCELED)
      throw new BadRequestException(
        ERROR_MESSAGE.APPOINTMENT_HAS_BEEN_CANCELLED,
      );
    // tạo transaction
    return await this.datasource.transaction(async (manager) => {
      // tạo mới appointment_cancellation
      const newAppointmentCancellation = manager.create(
        AppointmentCancellation,
        {
          appointment_id: id,
          cancellation_party,
          reason_code,
          note,
          user_account: {
            user_id,
          },
          appointment: {
            appointment_id: id,
          },
        },
      );

      await manager.save(newAppointmentCancellation);

      // cập nhật trường status thành cancelled trong bảng appointments
      await manager.update(Appointment, id, {
        status: StatusAppointment.CANCELED,
      });

      // cập nhật trường status trong bảng doctor_slots thành available
      await manager.update(DoctorSlot, appointmentFound.doctor_slot.slot_id, {
        status: StatusDoctorSlot.AVAILABLE,
      });
    });
  }

  // hàm hủy lịch khám - dành cho khách hàng
  async cancelByClient(
    id: number,
    cancellationAppointmentDto: CancellationAppointmentDto,
    userId: number,
  ) {
    const { cancellation_party, note, reason_code } =
      cancellationAppointmentDto;
    // tìm theo id
    const appointmentFound = await this.appointmentRepo.findOne({
      where: {
        appointment_id: id,
      },
      relations: ['doctor_slot'],
    });

    if (!appointmentFound)
      throw new NotFoundException(ERROR_MESSAGE.APPOINTMENT_NOT_FOUND);

    // nếu đã hủy thì báo lỗi
    if (appointmentFound.status === StatusAppointment.CANCELED)
      throw new BadRequestException(
        ERROR_MESSAGE.APPOINTMENT_HAS_BEEN_CANCELLED,
      );

    if (
      !this.isAtLeastBefore(
        appointmentFound.doctor_slot.slot_date,
        appointmentFound.doctor_slot.start_at,
        1,
      )
    ) {
      throw new BadRequestException(ERROR_MESSAGE.CANCEL_APPOINTMENT_TIME(1));
    }
    // tạo transaction
    return await this.datasource.transaction(async (manager) => {
      // tạo mới appointment_cancellation
      const newAppointmentCancellation = manager.create(
        AppointmentCancellation,
        {
          appointment_id: id,
          cancellation_party,
          reason_code,
          note,
          user_account: {
            user_id: userId,
          },
          appointment: {
            appointment_id: id,
          },
        },
      );

      await manager.save(newAppointmentCancellation);

      // cập nhật trường status thành cancelled trong bảng appointments
      await manager.update(Appointment, id, {
        status: StatusAppointment.CANCELED,
      });

      // cập nhật trường status trong bảng doctor_slots thành available
      await manager.update(DoctorSlot, appointmentFound.doctor_slot.slot_id, {
        status: StatusDoctorSlot.AVAILABLE,
      });
    });
  }

  // hàm lấy danh sách các lịch khám kết hợp tìm kiếm theo tên bệnh nhân, lọc theo trạng thái lịch khám, phân trang
  async findAll({ pageNum, limitNum, keyword, status, orderBy }) {
    const queryBuilder = this.appointmentRepo
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.doctor_slot', 'slot')
      .leftJoinAndSelect('appointment.patient', 'patient');

    // 1. search
    if (keyword) {
      // tìm kiếm theo tên bệnh nhân
      queryBuilder.andWhere('patient.fullname LIKE :keyword', {
        keyword: `%${keyword}%`,
      });
    }

    if (status) {
      // lọc theo trạng thái lịch khám
      queryBuilder.andWhere('appointment.status LIKE :status', {
        status: `%${status}%`,
      });
    }

    //2. sort
    queryBuilder.orderBy(`appointment.createdAt`, orderBy);

    //3. pagination
    const totalRecords = await queryBuilder.getCount();
    const appointments = await queryBuilder
      .skip((pageNum - 1) * limitNum)
      .take(limitNum)
      .getMany();
    const formattedAppointments = appointments.map((a) => {
      return {
        ...a,
        createdAt: toLocalTime(a.createdAt),
      };
    });

    return {
      appointments: formattedAppointments,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limitNum),
      conditions: {
        pageNum,
        limitNum,
        keyword,
        status,
        orderBy,
      },
    };
  }

  // hàm xem chi tiết appointment - dành cho phía quản trị
  async findOne(id: number) {
    const appointmentFound = await this.appointmentRepo.findOne({
      where: {
        appointment_id: id,
      },
      relations: {
        doctor_slot: {
          doctor: true,
        },
        patient: {
          contact: true,
        },
        appointment_cancellation: {
          user_account: {
            contact: true,
          },
        },
      },
      withDeleted: true,
    });
    if (!appointmentFound)
      throw new NotFoundException(ERROR_MESSAGE.APPOINTMENT_NOT_FOUND);

    const appointmentCancellationFormat = {
      ...appointmentFound.appointment_cancellation,
      cancelled_at: toLocalTime(
        appointmentFound.appointment_cancellation?.cancelled_at,
      ),
      user_account: {
        email: appointmentFound.appointment_cancellation?.user_account.email,
        fullname:
          appointmentFound.appointment_cancellation?.user_account.contact
            .fullname,
        phone_number:
          appointmentFound.appointment_cancellation?.user_account.contact
            .phone_number,
      },
    };

    return {
      ...appointmentFound,
      createdAt: toLocalTime(appointmentFound.createdAt),
      appointment_cancellation: appointmentCancellationFormat,
    };
  }

  // hàm lấy danh sách lịch sử đặt lịch của user đang đăng nhập
  async getHistoryBookingByUserLogin(userId: number) {
    const listAppointments = await this.appointmentRepo.find({
      where: {
        patient: {
          contact: {
            user_account: {
              user_id: userId,
            },
          },
        },
      },
      relations: {
        doctor_slot: {
          doctor: true,
        },
        patient: true,
        appointment_cancellation: true,
      },
      withDeleted: true,
    });
    return listAppointments;
  }

  // hàm kiểm tra ngày đặt lịch có nhỏ hơn 7 ngày hay không
  private isWithinOneWeek(bookingDate: string) {
    const now = moment();
    const oneWeekLater = moment().add(7, 'days');
    const date = moment(bookingDate, 'DD/MM/YYYY');

    return (
      date.isSameOrAfter(now, 'day') && date.isSameOrBefore(oneWeekLater, 'day')
    );
  }

  // hàm kiểm tra thời gian đặt lịch trước thời gian khám tối thiểu 2 tiếng
  private isAtLeastTwoHoursLater(appointmentDate, startTime) {
    const minAllowed = moment().add(2, 'hours');

    const appointmentDateTime = moment(
      `${appointmentDate} ${startTime}`,
      'DD/MM/YYYY HH:mm:ss',
    );

    return appointmentDateTime.isSameOrAfter(minAllowed);
  }

  // hàm sinh mã bệnh nhân
  private generatePatientCode(): string {
    return `PAC-${uuidv4()}`;
  }

  /**
   * Kiểm tra thời gian hiện tại có trước giờ khám ít nhất X phút/hours không
   * @param {string} appointmentDate - Ngày khám (format: DD/MM/YYYY)
   * @param {string} startTime - Giờ bắt đầu ca khám (format: HH:mm:ss)
   * @param {number} amount - Khoảng thời gian cần kiểm tra
   * @param {"minutes" | "hours"} unit - Đơn vị: "minutes" hoặc "hours"
   * @returns {boolean}
   */
  private isAtLeastBefore(
    appointmentDate: string,
    startTime: string,
    amount: number,
    unit: unitOfTime.Diff = 'hours', // mặc định đơn vị so sánh là giờ
  ): boolean {
    const now = moment();
    const appointmentDateTime = moment(
      `${appointmentDate} ${startTime}`,
      'DD/MM/YYYY HH:mm:ss',
    );

    const diff = appointmentDateTime.diff(now, unit);
    return diff >= amount;
  }
}
