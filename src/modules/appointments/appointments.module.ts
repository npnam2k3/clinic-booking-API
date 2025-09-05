import { Module } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from 'src/modules/appointments/entities/appointment.entity';
import { AppointmentCancellation } from 'src/modules/appointments/entities/appointment_cancellations.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Appointment, AppointmentCancellation])],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
})
export class AppointmentsModule {}
