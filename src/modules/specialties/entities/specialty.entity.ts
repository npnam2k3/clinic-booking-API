import { Doctor } from 'src/modules/doctors/entities/doctor.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'specialties' })
export class Specialty {
  @PrimaryGeneratedColumn()
  specialization_id: number;

  @Column({ nullable: true })
  specialization_name: string;

  @Column({ type: 'text' })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn({ nullable: true })
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date;

  // relation
  @OneToMany(() => Doctor, (doctor) => doctor.specialty)
  doctors: Doctor[];
}
