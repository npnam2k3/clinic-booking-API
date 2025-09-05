import { Role } from 'src/modules/roles/entities/role.entity';
import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'permissions' })
export class Permission {
  @PrimaryGeneratedColumn()
  permission_id: number;

  @Column()
  action: string;

  @Column()
  subject: string;

  // relation
  @ManyToMany(() => Role, (role) => role.permissions)
  roles: Role[];
}
