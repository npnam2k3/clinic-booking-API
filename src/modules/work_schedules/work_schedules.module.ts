import { Module } from '@nestjs/common';
import { WorkSchedulesService } from './work_schedules.service';
import { WorkSchedulesController } from './work_schedules.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkSchedule } from 'src/modules/work_schedules/entities/work_schedule.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WorkSchedule])],
  controllers: [WorkSchedulesController],
  providers: [WorkSchedulesService],
})
export class WorkSchedulesModule {}
