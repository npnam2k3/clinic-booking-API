import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from 'src/modules/users/users.module';
import { RolesModule } from 'src/modules/roles/roles.module';

@Module({
  imports: [JwtModule, UsersModule, RolesModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
