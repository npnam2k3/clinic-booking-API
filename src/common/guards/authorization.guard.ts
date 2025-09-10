import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ERROR_MESSAGE } from 'src/common/constants/exception.message';
import { PERMISSION_KEY } from 'src/common/decorators/permission.decorator';
import { Permission } from 'src/modules/permissions/dto/permission.dto';
import { RolesService } from 'src/modules/roles/roles.service';
import { UsersService } from 'src/modules/users/users.service';

@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly userService: UsersService,
    private readonly roleService: RolesService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    if (!request.user) {
      throw new ForbiddenException(ERROR_MESSAGE.FORBIDDEN);
    }

    // lấy permission yêu cầu trên mỗi api
    const requirePermission: Permission = this.reflector.getAllAndOverride(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    // nếu route không yêu cầu quyền truy cập thì cho qua
    if (!requirePermission) return true;

    // the user information is attached in request
    const { sub } = request.user;
    const user = await this.userService.findOne(+sub);

    if (!user) throw new ForbiddenException(ERROR_MESSAGE.FORBIDDEN);

    const userPermissions = await this.roleService.findPermissionsByRole(
      user?.role.role_id,
    );

    // nếu là Admin thì cho qua luôn
    if (user.role.role_name === 'ADMIN') return true;

    if (!userPermissions || userPermissions.length < 1)
      throw new ForbiddenException(ERROR_MESSAGE.FORBIDDEN);

    // format lại quyền yêu cầu trên route
    const requirePermissionFormatted = `${requirePermission.action}-${requirePermission.subject}`;

    // format lại các quyền của người dùng có
    const userPermissionsFormatted = userPermissions?.map(
      (per) => `${per.action}-${per.subject}`,
    );

    // kiểm tra trong danh sách quyền của user có tồn tại quyền được yêu cầu trên route hay không
    const matchPermission = userPermissionsFormatted?.includes(
      requirePermissionFormatted,
    );
    if (!matchPermission) throw new ForbiddenException(ERROR_MESSAGE.FORBIDDEN);
    return true;
  }
}
