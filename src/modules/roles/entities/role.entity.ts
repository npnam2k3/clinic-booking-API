import { Permission } from 'src/modules/permissions/entities/permission.entity';
import { UserAccount } from 'src/modules/users/entities/user_account.entity';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'roles' })
export class Role {
  @PrimaryGeneratedColumn()
  role_id: number;

  @Column()
  role_name: string;

  // relation
  @ManyToMany(() => Permission, (permission) => permission.roles)
  @JoinTable({
    name: 'roles_permissions',
    joinColumns: [{ name: 'role_id', referencedColumnName: 'role_id' }],
    inverseJoinColumns: [
      { name: 'permission_id', referencedColumnName: 'permission_id' },
    ],
  })
  permissions: Permission[];

  @OneToMany(() => UserAccount, (user_account) => user_account.role)
  user_accounts: UserAccount[];
}
