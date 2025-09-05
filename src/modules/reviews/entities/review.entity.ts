import { Doctor } from 'src/modules/doctors/entities/doctor.entity';
import { StatusReview, Vote } from 'src/modules/reviews/enum';
import { Contact } from 'src/modules/users/entities/contact.entity';
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

@Entity({ name: 'reviews' })
export class Review {
  @PrimaryGeneratedColumn()
  review_id: number;

  @Column({ type: 'enum', enum: Vote })
  vote: Vote;

  @Column({ type: 'text' })
  comment: string;

  @Column({ type: 'enum', enum: StatusReview })
  status: StatusReview;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn({ nullable: true })
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date;

  // relation
  @ManyToOne(() => Doctor, (doctor) => doctor.reviews)
  @JoinColumn({ name: 'doctor_id', referencedColumnName: 'doctor_id' })
  doctor: Doctor;

  @ManyToOne(() => Contact, (contact) => contact.reviews)
  @JoinColumn({ name: 'contact_id', referencedColumnName: 'contact_id' })
  contact: Contact;
}
