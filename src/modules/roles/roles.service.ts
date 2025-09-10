import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ERROR_MESSAGE } from 'src/common/constants/exception.message';
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

  async findRoleByName(roleName: string): Promise<Role> {
    const roleFound = await this.roleRepo.findOne({
      where: {
        role_name: roleName,
      },
    });
    if (!roleFound) throw new NotFoundException(ERROR_MESSAGE.ROLE_NOT_FOUND);

    return roleFound;
  }
}
