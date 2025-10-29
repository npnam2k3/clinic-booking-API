import { Global, MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor';
import { LoggerMiddleware } from 'src/common/middlewares/logger.middleware';
import { UsersModule } from 'src/modules/users/users.module';
import configuration from './configs/load.env';
import { DatabaseModule } from 'src/database/database.module';
import { AppointmentsModule } from 'src/modules/appointments/appointments.module';
import { AuthModule } from 'src/modules/auth/auth.module';
import { DoctorSlotsModule } from 'src/modules/doctor_slots/doctor_slots.module';
import { DoctorsModule } from 'src/modules/doctors/doctors.module';
import { PatientsModule } from 'src/modules/patients/patients.module';
import { SpecialtiesModule } from 'src/modules/specialties/specialties.module';
import { WorkSchedulesModule } from 'src/modules/work_schedules/work_schedules.module';
import { PermissionsModule } from 'src/modules/permissions/permissions.module';
import { RolesModule } from 'src/modules/roles/roles.module';
import { JwtModule } from '@nestjs/jwt';
import { MailModule } from 'src/common/mail/mail.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    JwtModule.register({}),

    DatabaseModule,

    MailModule,

    UsersModule,
    PermissionsModule,
    RolesModule,
    AppointmentsModule,
    AuthModule,
    DoctorSlotsModule,
    DoctorsModule,
    PatientsModule,
    SpecialtiesModule,
    WorkSchedulesModule,
    CloudinaryModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
  exports: [JwtModule],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
