import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Patient } from 'src/modules/patients/entities/patient.entity';
import { Repository } from 'typeorm';
import { ERROR_MESSAGE } from 'src/common/constants/exception.message';
import { toLocalTime } from 'src/common/utils/handleTime';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
  ) {}

  async findAll({ pageNum, limitNum, keyword, orderBy }) {
    const queryBuilder = this.patientRepo
      .createQueryBuilder('patient')
      .leftJoinAndSelect('patient.contact', 'contact');

    //1. search
    if (keyword) {
      queryBuilder.andWhere('patient.fullname LIKE :keyword', {
        keyword: `%${keyword}%`,
      });
    }

    //2. sort
    queryBuilder.orderBy(`patient.createdAt`, orderBy);

    //3. pagination
    const totalRecords = await queryBuilder.getCount();
    const patients = await queryBuilder
      .skip((pageNum - 1) * limitNum)
      .take(limitNum)
      .getMany();

    return {
      patients,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limitNum),
      conditions: {
        pageNum,
        limitNum,
        keyword,
        orderBy,
      },
    };
  }

  async findOne(patientCode: string) {
    const patientFound = await this.patientRepo.findOne({
      where: {
        patient_code: patientCode,
      },
      relations: {
        contact: true,
        appointments: {
          doctor_slot: true,
        },
      },
    });

    if (!patientFound)
      throw new NotFoundException(ERROR_MESSAGE.PATIENT_NOT_FOUND);
    const formattedResult = {
      ...patientFound,
      appointments: patientFound.appointments.map((a) => {
        return {
          ...a,
          createdAt: toLocalTime(a.createdAt),
        };
      }),
    };
    return formattedResult;
  }

  async update(patientCode: string, updatePatientDto: UpdatePatientDto) {
    // tìm theo id patient
    const patientFound = await this.patientRepo.findOne({
      where: {
        patient_code: patientCode,
      },
    });
    if (!patientFound)
      throw new NotFoundException(ERROR_MESSAGE.PATIENT_NOT_FOUND);

    console.log('check patient::', patientFound);
    await this.patientRepo.update(patientCode, updatePatientDto);
  }

  async remove(patientCode: string) {
    const patientFound = await this.patientRepo.count({
      where: {
        patient_code: patientCode,
      },
    });

    if (patientFound < 1)
      throw new NotFoundException(ERROR_MESSAGE.PATIENT_NOT_FOUND);
    await this.patientRepo.softDelete({ patient_code: patientCode });
  }
}
