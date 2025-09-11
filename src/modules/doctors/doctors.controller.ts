import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt_auth.guard';
import { AuthorizationGuard } from 'src/common/guards/authorization.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions } from 'src/configs/multer.config';
import { Permissions } from 'src/common/decorators/permission.decorator';
import { Action } from 'src/common/enums/action.enum';
import { Subject } from 'src/common/enums/subject.enum';

@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, AuthorizationGuard)
  @Permissions({ action: Action.create, subject: Subject.doctor })

  // validate file
  @UseInterceptors(FileInterceptor('avatar', multerOptions))
  create(
    @Body() createDoctorDto: CreateDoctorDto,
    @UploadedFile() avatar: Express.Multer.File,
  ) {
    return this.doctorsService.create(createDoctorDto, avatar);
  }

  @Get()
  findAll() {
    return this.doctorsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.doctorsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDoctorDto: UpdateDoctorDto) {
    return this.doctorsService.update(+id, updateDoctorDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.doctorsService.remove(+id);
  }
}
