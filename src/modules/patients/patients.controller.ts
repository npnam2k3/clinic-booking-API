import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { PatientsService } from './patients.service';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt_auth.guard';
import { AuthorizationGuard } from 'src/common/guards/authorization.guard';
import { Permissions } from 'src/common/decorators/permission.decorator';
import { Action } from 'src/common/enums/action.enum';
import { Subject } from 'src/common/enums/subject.enum';
import { ResponseMessage } from 'src/common/decorators/response.decorator';
import { RESPONSE_MESSAGE } from 'src/common/constants/response.message';
import { PAGINATION } from 'src/common/constants/pagination';

@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, AuthorizationGuard)
  @Permissions({ action: Action.read, subject: Subject.patient })
  findAll(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('keyword') keyword?: string,
    @Query('orderBy') orderBy: 'ASC' | 'DESC' = 'DESC',
  ) {
    const pageNum = page ? page : PAGINATION.PATIENT.PAGE_NUMBER;
    const limitNum = limit ? limit : PAGINATION.PATIENT.LIMIT_NUMBER;
    return this.patientsService.findAll({
      pageNum,
      limitNum,
      keyword,
      orderBy,
    });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, AuthorizationGuard)
  @Permissions({ action: Action.read, subject: Subject.patient })
  findOne(@Param('id') id: string) {
    return this.patientsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, AuthorizationGuard)
  @Permissions({ action: Action.update, subject: Subject.patient })
  @ResponseMessage(RESPONSE_MESSAGE.UPDATE)
  update(@Param('id') id: string, @Body() updatePatientDto: UpdatePatientDto) {
    return this.patientsService.update(id, updatePatientDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AuthorizationGuard)
  @Permissions({ action: Action.delete, subject: Subject.patient })
  @ResponseMessage(RESPONSE_MESSAGE.DELETE)
  remove(@Param('id') id: string) {
    return this.patientsService.remove(id);
  }
}
