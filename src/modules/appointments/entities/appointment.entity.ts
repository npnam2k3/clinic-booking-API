import { AppointmentCancellation } from 'src/modules/appointments/entities/appointment_cancellations.entity';
import { StatusAppointment } from 'src/modules/appointments/enum';
import { DoctorSlot } from 'src/modules/doctor_slots/entities/doctor_slot.entity';
import { Patient } from 'src/modules/patients/entities/patient.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'appointments' })
export class Appointment {
  @PrimaryGeneratedColumn()
  appointment_id: number;

  @Column({ type: 'date' })
  appointment_date: Date;

  @Column({ type: 'enum', enum: StatusAppointment })
  status: StatusAppointment;

  @Column({ type: 'text' })
  note: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn({ nullable: true })
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date;

  // relation
  @OneToOne(() => DoctorSlot, (doctor_slot) => doctor_slot.appointment)
  @JoinColumn({ name: 'slot_id', referencedColumnName: 'slot_id' })
  doctor_slot: DoctorSlot;

  @ManyToOne(() => Patient, (patient) => patient.appointments)
  @JoinColumn({ name: 'patient_code', referencedColumnName: 'patient_code' })
  patient: Patient;

  @OneToOne(
    () => AppointmentCancellation,
    (appointment_cancellation) => appointment_cancellation.appointment,
  )
  appointment_cancellation: AppointmentCancellation;
}
