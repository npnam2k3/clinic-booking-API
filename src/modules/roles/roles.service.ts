import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from 'src/modules/roles/entities/role.entity';
import { Repository } from 'typeorm';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
  ) {}

  async findPermissionsByRole(roleId: number) {
    const role = await this.roleRepo.findOne({
      where: {
        role_id: roleId,
      },
      relations: {
        permissions: true,
      },
    });
    return role?.permissions;
  }
}
