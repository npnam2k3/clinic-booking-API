import { Doctor } from 'src/modules/doctors/entities/doctor.entity';
import { StatusWorkSchedule } from 'src/modules/work_schedules/enum';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'work_schedules' })
export class WorkSchedule {
  @PrimaryGeneratedColumn()
  schedule_id: number;

  @Column({ type: 'varchar' })
  day_of_week: string;

  @Column({ type: 'time' })
  start_time: string;

  @Column({ type: 'time' })
  end_time: string;

  @Column({ type: 'int' })
  slot_duration: number;

  @Column({ type: 'text' })
  note: string;

  @Column({ type: 'varchar', nullable: true })
  effective_date: string;

  @Column({ type: 'varchar', nullable: true })
  expire_date: string;

  @Column({
    type: 'enum',
    enum: StatusWorkSchedule,
    default: StatusWorkSchedule.active,
  })
  status: StatusWorkSchedule;

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
}
