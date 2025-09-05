import { Module } from '@nestjs/common';
import { DoctorSlotsService } from './doctor_slots.service';
import { DoctorSlotsController } from './doctor_slots.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorSlot } from 'src/modules/doctor_slots/entities/doctor_slot.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DoctorSlot])],
  controllers: [DoctorSlotsController],
  providers: [DoctorSlotsService],
})
export class DoctorSlotsModule {}
