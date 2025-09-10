import { SetMetadata } from '@nestjs/common';
import { Permission } from 'src/modules/permissions/dto/permission.dto';

export const PERMISSION_KEY = 'permission';
export const Permissions = (permission: Permission) =>
  SetMetadata(PERMISSION_KEY, permission);
