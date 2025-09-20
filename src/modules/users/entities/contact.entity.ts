import { Patient } from 'src/modules/patients/entities/patient.entity';
import { Review } from 'src/modules/reviews/entities/review.entity';
import { UserAccount } from 'src/modules/users/entities/user_account.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'contacts' })
export class Contact {
  @PrimaryGeneratedColumn()
  contact_id: number;

  @Column({ unique: true })
  phone_number: string;

  @Column({ nullable: true })
  address: string;

  @Column()
  fullname: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn({ nullable: true })
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date;

  // relation
  @OneToOne(() => UserAccount, (user_account) => user_account.contact)
  @JoinColumn({ name: 'user_id', referencedColumnName: 'user_id' })
  user_account: UserAccount;

  @OneToMany(() => Patient, (patient) => patient.contact)
  patients: Patient[];

  @OneToMany(() => Review, (review) => review.contact)
  reviews: Review[];
}
