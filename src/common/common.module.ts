import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthorizationGuard } from 'src/common/guards/authorization.guard';
import { JwtAuthGuard } from 'src/common/guards/jwt_auth.guard';
import { RolesModule } from 'src/modules/roles/roles.module';
import { UsersModule } from 'src/modules/users/users.module';

// common.module.ts
@Module({
  imports: [
    forwardRef(() => UsersModule),
    forwardRef(() => RolesModule),
    JwtModule,
  ], // để guard inject được UserService
  providers: [AuthorizationGuard, JwtAuthGuard],
  exports: [RolesModule],
})
export class CommonModule {}
