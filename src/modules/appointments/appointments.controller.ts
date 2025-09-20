import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  UseGuards,
  Query,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt_auth.guard';
import { AuthorizationGuard } from 'src/common/guards/authorization.guard';
import { Permissions } from 'src/common/decorators/permission.decorator';
import { Action } from 'src/common/enums/action.enum';
import { Subject } from 'src/common/enums/subject.enum';
import { ResponseMessage } from 'src/common/decorators/response.decorator';
import { RESPONSE_MESSAGE } from 'src/common/constants/response.message';
import { CancellationAppointmentDto } from 'src/modules/appointments/dto/cancellation-appointment.dto';
import { PAGINATION } from 'src/common/constants/pagination';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  create(@Body() createAppointmentDto: CreateAppointmentDto) {
    return this.appointmentsService.create(createAppointmentDto);
  }

  @Patch('confirm/:id')
  @UseGuards(JwtAuthGuard, AuthorizationGuard)
  @Permissions({ action: Action.confirm, subject: Subject.appointment })
  @ResponseMessage(RESPONSE_MESSAGE.CONFIRM_APPOINTMENT)
  confirm(@Param('id') id: string) {
    return this.appointmentsService.confirm(+id);
  }

  @Patch('admin/cancel/:id')
  @UseGuards(JwtAuthGuard, AuthorizationGuard)
  @Permissions({ action: Action.cancel, subject: Subject.appointment })
  @ResponseMessage(RESPONSE_MESSAGE.CANCEL_APPOINTMENT)
  cancelByAdmin(
    @Param('id') id: string,
    @Body() cancellationAppointmentDto: CancellationAppointmentDto,
    @Request() req,
  ) {
    const { sub } = req.user;
    return this.appointmentsService.cancelByAdmin(
      +id,
      cancellationAppointmentDto,
      +sub,
    );
  }

  @Patch('client/cancel/:id')
  @UseGuards(JwtAuthGuard)
  @ResponseMessage(RESPONSE_MESSAGE.CANCEL_APPOINTMENT)
  cancelByClient(
    @Param('id') id: string,
    @Body() cancellationAppointmentDto: CancellationAppointmentDto,
    @Request() req,
  ) {
    const { sub } = req.user;
    return this.appointmentsService.cancelByClient(
      +id,
      cancellationAppointmentDto,
      +sub,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard, AuthorizationGuard)
  @Permissions({ action: Action.read, subject: Subject.appointment })
  findAll(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('keyword') keyword?: string,
    @Query('status') status?: string,
    @Query('orderBy') orderBy: 'ASC' | 'DESC' = 'DESC',
  ) {
    const pageNum = page ? page : PAGINATION.APPOINTMENT.PAGE_NUMBER;
    const limitNum = limit ? limit : PAGINATION.APPOINTMENT.LIMIT_NUMBER;
    return this.appointmentsService.findAll({
      pageNum,
      limitNum,
      keyword,
      status,
      orderBy,
    });
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  getHistoryBookingByUserLogin(@Request() req) {
    const { sub } = req.user;
    return this.appointmentsService.getHistoryBookingByUserLogin(+sub);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, AuthorizationGuard)
  @Permissions({ action: Action.read, subject: Subject.appointment })
  @ResponseMessage(RESPONSE_MESSAGE.GET)
  findOne(@Param('id') id: string) {
    return this.appointmentsService.findOne(+id);
  }
}
