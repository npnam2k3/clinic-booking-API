import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { DoctorSlotsService } from './doctor_slots.service';
import { CreateDoctorSlotDto } from './dto/create-doctor_slot.dto';
import { UpdateDoctorSlotDto } from './dto/update-doctor_slot.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt_auth.guard';
import { AuthorizationGuard } from 'src/common/guards/authorization.guard';
import { Permissions } from 'src/common/decorators/permission.decorator';
import { Action } from 'src/common/enums/action.enum';
import { Subject } from 'src/common/enums/subject.enum';
import { ResponseMessage } from 'src/common/decorators/response.decorator';
import { RESPONSE_MESSAGE } from 'src/common/constants/response.message';

@Controller('doctor-slots')
export class DoctorSlotsController {
  constructor(private readonly doctorSlotsService: DoctorSlotsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, AuthorizationGuard)
  @Permissions({ action: Action.create, subject: Subject.doctor_slot })
  @ResponseMessage(RESPONSE_MESSAGE.CREATE)
  create(@Body() createDoctorSlotDto: CreateDoctorSlotDto) {
    return this.doctorSlotsService.create(createDoctorSlotDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, AuthorizationGuard)
  @Permissions({ action: Action.update, subject: Subject.doctor_slot })
  @ResponseMessage(RESPONSE_MESSAGE.UPDATE)
  update(
    @Param('id') id: string,
    @Body() updateDoctorSlotDto: UpdateDoctorSlotDto,
  ) {
    return this.doctorSlotsService.update(+id, updateDoctorSlotDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.doctorSlotsService.remove(+id);
  }
}
