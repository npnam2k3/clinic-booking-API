import { AppointmentCancellation } from 'src/modules/appointments/entities/appointment_cancellations.entity';
import { Role } from 'src/modules/roles/entities/role.entity';
import { Contact } from 'src/modules/users/entities/contact.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'user_accounts' })
export class UserAccount {
  @PrimaryGeneratedColumn()
  user_id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  hashed_password: string;

  @Column({ type: 'varchar', nullable: true })
  hashed_refresh_token: string | null;

  @Column({ type: 'varchar', nullable: true })
  token_reset_password: string | null;

  @Column({ type: 'datetime', nullable: true })
  token_reset_password_expiration: Date | null;

  @Column({ type: 'boolean', default: false })
  is_block: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn({ nullable: true })
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date;

  // relation
  @OneToOne(() => Contact, (contact) => contact.user_account, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  contact: Contact;

  @ManyToOne(() => Role, (role) => role.user_accounts)
  @JoinColumn({ name: 'role_id', referencedColumnName: 'role_id' })
  role: Role;

  @OneToMany(
    () => AppointmentCancellation,
    (appointment_cancellation) => appointment_cancellation.user_account,
  )
  appointment_cancellations: AppointmentCancellation[];
}
