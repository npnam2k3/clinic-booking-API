import { DoctorSlot } from 'src/modules/doctor_slots/entities/doctor_slot.entity';
import { Doctor } from 'src/modules/doctors/entities/doctor.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'work_schedules' })
export class WorkSchedule {
  @PrimaryGeneratedColumn()
  schedule_id: number;

  @Column({ type: 'int' })
  day_of_week: number;

  @Column({ type: 'time' })
  start_time: string;

  @Column({ type: 'time' })
  end_time: string;

  @Column({ type: 'int' })
  slot_duration: number;

  @Column({ type: 'text' })
  note: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn({ nullable: true })
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date;

  // relation
  @ManyToOne(() => Doctor, (doctor) => doctor.work_schedules)
  @JoinColumn({ name: 'doctor_id', referencedColumnName: 'doctor_id' })
  doctor: Doctor;

  @OneToMany(() => DoctorSlot, (doctor_slot) => doctor_slot.work_schedule)
  doctor_slots: DoctorSlot[];
}
