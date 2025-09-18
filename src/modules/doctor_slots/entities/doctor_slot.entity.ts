import { Appointment } from 'src/modules/appointments/entities/appointment.entity';
import { StatusDoctorSlot } from 'src/modules/doctor_slots/enum';
import { Doctor } from 'src/modules/doctors/entities/doctor.entity';
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

@Entity({ name: 'doctor_slots' })
export class DoctorSlot {
  @PrimaryGeneratedColumn()
  slot_id: number;

  @Column({ type: 'time' })
  start_at: string;

  @Column({ type: 'time' })
  end_at: string;

  @Column({ type: 'varchar' })
  slot_date: string;

  @Column({ nullable: true })
  source_type: string;

  @Column({ type: 'int', nullable: true })
  source_id: number;

  @Column({ type: 'enum', enum: StatusDoctorSlot })
  status: StatusDoctorSlot;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn({ nullable: true })
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date;

  // relation
  @ManyToOne(() => Doctor, (doctor) => doctor.doctor_slots)
  @JoinColumn({ name: 'doctor_id', referencedColumnName: 'doctor_id' })
  doctor: Doctor;

  @OneToOne(() => Appointment, (appointment) => appointment.doctor_slot)
  appointment: Appointment;
}
