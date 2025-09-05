import { Injectable } from '@nestjs/common';
import { CreateDoctorSlotDto } from './dto/create-doctor_slot.dto';
import { UpdateDoctorSlotDto } from './dto/update-doctor_slot.dto';

@Injectable()
export class DoctorSlotsService {
  create(createDoctorSlotDto: CreateDoctorSlotDto) {
    return 'This action adds a new doctorSlot';
  }

  findAll() {
    return `This action returns all doctorSlots`;
  }

  findOne(id: number) {
    return `This action returns a #${id} doctorSlot`;
  }

  update(id: number, updateDoctorSlotDto: UpdateDoctorSlotDto) {
    return `This action updates a #${id} doctorSlot`;
  }

  remove(id: number) {
    return `This action removes a #${id} doctorSlot`;
  }
}
