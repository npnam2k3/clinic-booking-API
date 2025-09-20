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

  findAll() {
    return `This action returns all patients`;
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
