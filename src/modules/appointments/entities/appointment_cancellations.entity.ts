import { Appointment } from 'src/modules/appointments/entities/appointment.entity';
import { CancellationParty, ReasonCode } from 'src/modules/appointments/enum';
import { UserAccount } from 'src/modules/users/entities/user_account.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryColumn,
} from 'typeorm';

@Entity({ name: 'appointment_cancellations' })
export class AppointmentCancellation {
  @PrimaryColumn()
  appointment_id: number;

  @Column({ type: 'enum', enum: CancellationParty })
  cancellation_party: CancellationParty;

  @Column({ type: 'enum', enum: ReasonCode })
  reason_code: ReasonCode;

  @Column({ type: 'text' })
  note: string;

  @Column({ type: 'datetime' })
  cancelled_at: Date;

  // relation
  @OneToOne(
    () => Appointment,
    (appointment) => appointment.appointment_cancellation,
  )
  @JoinColumn({
    name: 'appointment_id',
    referencedColumnName: 'appointment_id',
  })
  appointment: Appointment;

  @ManyToOne(
    () => UserAccount,
    (user_account) => user_account.appointment_cancellations,
  )
  @JoinColumn({ name: 'cancelled_by_user', referencedColumnName: 'user_id' })
  user_account: UserAccount;
}
