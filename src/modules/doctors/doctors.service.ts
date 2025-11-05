import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { DataSource, Not, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Doctor } from 'src/modules/doctors/entities/doctor.entity';
import { ERROR_MESSAGE } from 'src/common/constants/exception.message';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { toDTO } from 'src/common/utils/mapToDto';
import { DoctorResponseDto } from 'src/modules/doctors/dto/doctor-response.dto';
import { StatusDoctorSlot } from 'src/modules/doctor_slots/enum';
import moment from 'moment';
import { DoctorSlot } from 'src/modules/doctor_slots/entities/doctor_slot.entity';
import { WorkSchedule } from 'src/modules/work_schedules/entities/work_schedule.entity';

@Injectable()
export class DoctorsService {
  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(Doctor)
    private readonly doctorRepo: Repository<Doctor>,

    private readonly cloudinaryService: CloudinaryService,
  ) {}
  async create(
    createDoctorDto: CreateDoctorDto,
    avatar: Express.Multer.File,
  ): Promise<DoctorResponseDto> {
    // kiểm tra phone trùng
    const checkPhoneDuplicate = await this.doctorRepo.count({
      where: {
        phone_number: createDoctorDto.phone_number,
      },
    });
    if (checkPhoneDuplicate > 0)
      throw new ConflictException(ERROR_MESSAGE.PHONE_NUMBER_EXISTS);

    // kiểm tra email trùng
    const checkEmailDuplicate = await this.doctorRepo.count({
      where: {
        email: createDoctorDto.email,
      },
    });
    if (checkEmailDuplicate > 0)
      throw new ConflictException(ERROR_MESSAGE.EMAIL_EXISTS);

    // tạo transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let uploadResult: { secure_url: string; public_id: string } | null = null;
    try {
      // upload file nếu có
      if (avatar) {
        uploadResult = await this.cloudinaryService.uploadFile(avatar);
      }

      // tạo mới doctor
      const newDoctor = queryRunner.manager.create(Doctor, {
        fullname: createDoctorDto.fullname,
        gender: createDoctorDto.gender,
        degree: createDoctorDto.degree,
        position: createDoctorDto.position,
        description: createDoctorDto.description,
        years_of_experience: createDoctorDto.years_of_experience,
        phone_number: createDoctorDto.phone_number,
        email: createDoctorDto.email,
        avatar_url: uploadResult?.secure_url,
        specialty: {
          specialization_id: createDoctorDto.specialization_id,
        },
      });
      await queryRunner.manager.save(newDoctor);

      // commit
      await queryRunner.commitTransaction();
      return toDTO(DoctorResponseDto, newDoctor) as DoctorResponseDto;
    } catch (error) {
      console.log('Check error::', error);
      // Nếu insert vào database lỗi => rollback transaction
      await queryRunner.rollbackTransaction();

      // Nếu Cloudinary đã upload thành công thì xóa đi
      if (uploadResult?.public_id) {
        await this.cloudinaryService.deleteFile(uploadResult.public_id);
      }
      throw new InternalServerErrorException(
        ERROR_MESSAGE.INTERNAL_ERROR_SERVER,
      );
    } finally {
      // đóng kết nối
      await queryRunner.release();
    }
  }

  async findAll({ pageNum, limitNum, keyword, specialtyId, sortBy, orderBy }) {
    const queryBuilder = this.doctorRepo
      .createQueryBuilder('doctor')
      .leftJoinAndSelect('doctor.specialty', 'specialty');

    //1. search and filter
    if (keyword) {
      queryBuilder.andWhere('doctor.fullname LIKE :keyword', {
        keyword: `%${keyword}%`,
      });
    }
    if (specialtyId) {
      queryBuilder.andWhere('specialty.specialization_id = :specialtyId', {
        specialtyId,
      });
    }

    //2. sort
    queryBuilder.orderBy(`doctor.${sortBy}`, orderBy);

    //3. pagination
    const totalRecords = await queryBuilder.getCount();
    const doctors = await queryBuilder
      .skip((pageNum - 1) * limitNum)
      .take(limitNum)
      .getMany();

    return {
      doctors,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limitNum),
      conditions: {
        pageNum,
        limitNum,
        keyword,
        sortBy,
        orderBy,
        specialtyId,
      },
    };
  }

  // async findOne(id: number) {
  //   const today = new Date();

  //   const doctorFound = await this.doctorRepo
  //     .createQueryBuilder('doctor')
  //     .leftJoinAndSelect('doctor.specialty', 'specialty')
  //     .leftJoinAndSelect(
  //       'doctor.work_schedules',
  //       'work_schedules',
  //       // `work_schedules.effective_date <= :today AND work_schedules.expire_date >= :today`,
  //       `
  //       (
  //         (work_schedules.effective_date <= :today AND work_schedules.expire_date >= :today)
  //         OR
  //         (work_schedules.effective_date > :today)
  //       )
  //     `,
  //     )
  //     .leftJoinAndSelect(
  //       'doctor.doctor_slots',
  //       'slots',
  //       `STR_TO_DATE(slots.slot_date, '%d/%m/%Y') >= DATE(:today)
  //       AND slots.status = :status`,
  //     )
  //     .where('doctor.doctor_id = :id', { id })
  //     .setParameter('today', today)
  //     .setParameter('status', StatusDoctorSlot.AVAILABLE)
  //     .getOne();
  //   if (!doctorFound)
  //     throw new NotFoundException(ERROR_MESSAGE.DOCTOR_NOT_FOUND);

  //   // format data
  //   const listWorkSchedules = doctorFound.work_schedules;

  //   // convert chuỗi ngày tháng năm từ 'DD/MM/YYYY' => 'YYYY-MM-DD'
  //   const listSlots = doctorFound.doctor_slots.map((slot) => ({
  //     ...slot,
  //     slot_date: moment(slot.slot_date, 'DD/MM/YYYY').format('YYYY-MM-DD'),
  //   }));

  //   // Gộp slot vào từng schedule
  //   const mergedSchedules = listWorkSchedules.map((schedule) => ({
  //     ...schedule,
  //     slots: listSlots.filter(
  //       (slot) => slot.source_id === schedule.schedule_id,
  //     ),
  //   }));
  //   doctorFound.work_schedules = mergedSchedules;

  //   return {
  //     ...doctorFound,
  //     doctor_slots: undefined,
  //     work_schedules: mergedSchedules,
  //   };
  // }

  async findOne(id: number) {
    const today = new Date();

    // 1 Lấy lịch hiện tại
    let doctorFound = await this.doctorRepo
      .createQueryBuilder('doctor')
      .leftJoinAndSelect('doctor.specialty', 'specialty')
      .leftJoinAndSelect(
        'doctor.work_schedules',
        'work_schedules',
        `DATE(work_schedules.effective_date) <= DATE(:today)
       AND DATE(work_schedules.expire_date) >= DATE(:today)`,
      )
      .leftJoinAndSelect(
        'doctor.doctor_slots',
        'slots',
        `STR_TO_DATE(slots.slot_date, '%d/%m/%Y') >= DATE(:today)
       AND slots.status = :status`,
      )
      .where('doctor.doctor_id = :id', { id })
      .setParameters({ today, status: StatusDoctorSlot.AVAILABLE })
      .getOne();

    // 2 Nếu chưa có lịch hiện tại → lấy lịch tương lai gần nhất
    if (!doctorFound?.work_schedules?.length) {
      const nextSchedule = await this.doctorRepo
        .createQueryBuilder('doctor')
        .leftJoinAndSelect('doctor.specialty', 'specialty')
        .leftJoinAndSelect(
          'doctor.work_schedules',
          'work_schedules',
          `DATE(work_schedules.effective_date) = (
          SELECT MIN(DATE(effective_date))
          FROM work_schedules
          WHERE doctor_id = :id
          AND DATE(effective_date) > DATE(:today)
        )`,
        )
        .leftJoinAndSelect(
          'doctor.doctor_slots',
          'slots',
          `STR_TO_DATE(slots.slot_date, '%d/%m/%Y') >= DATE(:today)
         AND slots.status = :status`,
        )
        .where('doctor.doctor_id = :id', { id })
        .setParameters({ today, status: StatusDoctorSlot.AVAILABLE })
        .getOne();

      doctorFound = nextSchedule;
    }

    if (!doctorFound)
      throw new NotFoundException(ERROR_MESSAGE.DOCTOR_NOT_FOUND);

    // 3 Format dữ liệu
    const listWorkSchedules = doctorFound.work_schedules || [];

    const listSlots = doctorFound.doctor_slots.map((slot) => ({
      ...slot,
      slot_date: moment(slot.slot_date, 'DD/MM/YYYY').format('YYYY-MM-DD'),
    }));

    const mergedSchedules = listWorkSchedules.map((schedule) => ({
      ...schedule,
      slots: listSlots.filter(
        (slot) => slot.source_id === schedule.schedule_id,
      ),
    }));

    doctorFound.work_schedules = mergedSchedules;

    return {
      ...doctorFound,
      doctor_slots: undefined,
      work_schedules: mergedSchedules,
    };
  }

  async update(
    id: number,
    updateDoctorDto: UpdateDoctorDto,
    avatar: Express.Multer.File,
  ) {
    // tìm doctor theo id
    const doctorFound = await this.doctorRepo.findOne({
      where: {
        doctor_id: id,
      },
    });

    if (!doctorFound) {
      throw new NotFoundException(ERROR_MESSAGE.DOCTOR_NOT_FOUND);
    }

    // kiểm tra số điện thoại có trùng với các doctor khác hay không
    if (Object.keys(updateDoctorDto).includes('phone_number')) {
      const checkPhoneDuplicate = await this.doctorRepo.count({
        where: {
          phone_number: updateDoctorDto.phone_number,
          doctor_id: Not(id),
        },
      });
      if (checkPhoneDuplicate > 0)
        throw new ConflictException(ERROR_MESSAGE.PHONE_NUMBER_EXISTS);
    }

    // kiểm tra email có trùng với các doctor khác hay không
    if (Object.keys(updateDoctorDto).includes('email')) {
      const checkEmailDuplicate = await this.doctorRepo.count({
        where: {
          email: updateDoctorDto.email,
          doctor_id: Not(id),
        },
      });
      if (checkEmailDuplicate > 0)
        throw new ConflictException(ERROR_MESSAGE.EMAIL_EXISTS);
    }

    // tạo transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let uploadResult: { secure_url: string; public_id: string } | null = null;

    // giữ lại url ảnh cũ để xóa
    const oldAvatarUrl = doctorFound.avatar_url;

    try {
      // 1. Upload ảnh mới nếu có
      if (avatar) {
        uploadResult = await this.cloudinaryService.uploadFile(avatar);
      }

      // 2. Update DB
      // merge các giá trị từ DTO
      Object.assign(doctorFound, updateDoctorDto, {
        ...(uploadResult && { avatar_url: uploadResult.secure_url }),
        ...(updateDoctorDto.specialization_id && {
          specialty: { specialization_id: updateDoctorDto.specialization_id },
        }),
      });

      await queryRunner.manager.save(doctorFound);

      // 3. Commit transaction
      await queryRunner.commitTransaction();

      // 4. Sau khi commit thành công mới xóa ảnh cũ
      if (avatar && oldAvatarUrl) {
        await this.cloudinaryService.deleteFile(oldAvatarUrl);
      }
    } catch (error) {
      console.log('check error::', error.message);
      await queryRunner.rollbackTransaction();

      // cleanup ảnh mới nếu DB fail
      if (uploadResult?.public_id) {
        await this.cloudinaryService.deleteFile(uploadResult.public_id);
      }

      throw new InternalServerErrorException(
        ERROR_MESSAGE.INTERNAL_ERROR_SERVER,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: number) {
    const doctorFound = await this.doctorRepo.count({
      where: {
        doctor_id: id,
      },
    });
    if (doctorFound < 1)
      throw new NotFoundException(ERROR_MESSAGE.DOCTOR_NOT_FOUND);

    await this.doctorRepo.softDelete(doctorFound);
  }
}
