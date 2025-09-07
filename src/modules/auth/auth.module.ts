import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserAccount } from 'src/modules/users/entities/user_account.entity';
import { JwtModule } from '@nestjs/jwt';
import { Contact } from 'src/modules/users/entities/contact.entity';
import { UsersModule } from 'src/modules/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserAccount, Contact]),
    JwtModule,
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
