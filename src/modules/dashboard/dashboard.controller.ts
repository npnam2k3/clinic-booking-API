import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from 'src/common/guards/jwt_auth.guard';
import { AuthorizationGuard } from 'src/common/guards/authorization.guard';
import { Permissions } from 'src/common/decorators/permission.decorator';
import { Action } from 'src/common/enums/action.enum';
import { Subject } from 'src/common/enums/subject.enum';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('basic-statistic')
  @UseGuards(JwtAuthGuard, AuthorizationGuard)
  @Permissions({ action: Action.read, subject: Subject.dashboard })
  getBasicStatistic() {
    return this.dashboardService.getBasicStatistic();
  }

  @Get('weekly-appointment-statistic')
  @UseGuards(JwtAuthGuard, AuthorizationGuard)
  @Permissions({ action: Action.read, subject: Subject.dashboard })
  getWeeklyAppointmentStatistic() {
    return this.dashboardService.getWeeklyAppointmentStatistic();
  }

  @Get('upcoming-appointments')
  @UseGuards(JwtAuthGuard, AuthorizationGuard)
  @Permissions({ action: Action.read, subject: Subject.dashboard })
  getUpcomingAppointments() {
    return this.dashboardService.getUpcomingAppointments();
  }
}
