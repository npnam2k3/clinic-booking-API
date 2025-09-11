import { DoctorSlot } from 'src/modules/doctor_slots/entities/doctor_slot.entity';
import { Gender } from 'src/modules/patients/enum';
import { Review } from 'src/modules/reviews/entities/review.entity';
import { Specialty } from 'src/modules/specialties/entities/specialty.entity';
import { WorkSchedule } from 'src/modules/work_schedules/entities/work_schedule.entity';
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

@Entity({ name: 'doctors' })
export class Doctor {
  @PrimaryGeneratedColumn()
  doctor_id: number;

  @Column()
  fullname: string;

  @Column({ type: 'enum', enum: Gender })
  gender: Gender;

  @Column()
  degree: string;

  @Column()
  position: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'int' })
  years_of_experience: number;

  @Column({ unique: true })
  phone_number: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  avatar_url: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn({ nullable: true })
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date;

  // relation
  @ManyToOne(() => Specialty, (specialty) => specialty.doctors)
  @JoinColumn({
    name: 'specialization_id',
    referencedColumnName: 'specialization_id',
  })
  specialty: Specialty;

  @OneToMany(() => WorkSchedule, (work_schedule) => work_schedule.doctor)
  work_schedules: WorkSchedule[];

  @OneToMany(() => DoctorSlot, (doctor_slot) => doctor_slot.doctor)
  doctor_slots: DoctorSlot[];

  @OneToMany(() => Review, (review) => review.doctor)
  reviews: Review[];
}
