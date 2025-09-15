import { Module } from '@nestjs/common';
import { DoctorSlotsService } from './doctor_slots.service';
import { DoctorSlotsController } from './doctor_slots.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorSlot } from 'src/modules/doctor_slots/entities/doctor_slot.entity';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from 'src/modules/users/users.module';
import { RolesModule } from 'src/modules/roles/roles.module';
import { WorkSchedule } from 'src/modules/work_schedules/entities/work_schedule.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([DoctorSlot, WorkSchedule]),
    JwtModule,
    UsersModule,
    RolesModule,
  ],
  controllers: [DoctorSlotsController],
  providers: [DoctorSlotsService],
})
export class DoctorSlotsModule {}
