import { Appointment } from 'src/modules/appointments/entities/appointment.entity';
import { Gender } from 'src/modules/patients/enum';
import { Contact } from 'src/modules/users/entities/contact.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'patients' })
export class Patient {
  @PrimaryColumn()
  patient_code: string;

  @Column()
  fullname: string;

  @Column()
  date_of_birth: string;

  @Column({ type: 'enum', enum: Gender })
  gender: Gender;

  @Column()
  address: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn({ nullable: true })
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date;

  // relation
  @ManyToOne(() => Contact, (contact) => contact.patients)
  @JoinColumn({ name: 'contact_id', referencedColumnName: 'contact_id' })
  contact: Contact;

  @OneToMany(() => Appointment, (appointment) => appointment.patient)
  appointments: Appointment[];
}
