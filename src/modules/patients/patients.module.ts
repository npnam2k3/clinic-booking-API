import { Module } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { PatientsController } from './patients.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Patient } from 'src/modules/patients/entities/patient.entity';
import { RolesModule } from 'src/modules/roles/roles.module';
import { UsersModule } from 'src/modules/users/users.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([Patient]),
    RolesModule,
    UsersModule,
    JwtModule,
  ],
  controllers: [PatientsController],
  providers: [PatientsService],
})
export class PatientsModule {}
