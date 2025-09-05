import { PartialType } from '@nestjs/mapped-types';
import { CreateDoctorSlotDto } from './create-doctor_slot.dto';

export class UpdateDoctorSlotDto extends PartialType(CreateDoctorSlotDto) {}
