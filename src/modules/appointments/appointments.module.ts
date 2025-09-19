import { Module } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from 'src/modules/appointments/entities/appointment.entity';
import { AppointmentCancellation } from 'src/modules/appointments/entities/appointment_cancellations.entity';
import { Contact } from 'src/modules/users/entities/contact.entity';
import { Patient } from 'src/modules/patients/entities/patient.entity';
import { DoctorSlot } from 'src/modules/doctor_slots/entities/doctor_slot.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Appointment,
      AppointmentCancellation,
      Contact,
      Patient,
      DoctorSlot,
    ]),
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
})
export class AppointmentsModule {}
