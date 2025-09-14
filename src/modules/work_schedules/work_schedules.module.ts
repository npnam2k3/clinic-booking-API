import { Module } from '@nestjs/common';
import { WorkSchedulesService } from './work_schedules.service';
import { WorkSchedulesController } from './work_schedules.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkSchedule } from 'src/modules/work_schedules/entities/work_schedule.entity';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from 'src/modules/users/users.module';
import { RolesModule } from 'src/modules/roles/roles.module';
import { Doctor } from 'src/modules/doctors/entities/doctor.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkSchedule, Doctor]),
    JwtModule,
    UsersModule,
    RolesModule,
  ],
  controllers: [WorkSchedulesController],
  providers: [WorkSchedulesService],
})
export class WorkSchedulesModule {}
