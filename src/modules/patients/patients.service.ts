import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Patient } from 'src/modules/patients/entities/patient.entity';
import { Repository } from 'typeorm';
import { ERROR_MESSAGE } from 'src/common/constants/exception.message';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
  ) {}

  findAll() {
    return `This action returns all patients`;
  }

  findOne(id: number) {
    return `This action returns a #${id} patient`;
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

  remove(id: number) {
    return `This action removes a #${id} patient`;
  }
}
