import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserAccount } from 'src/modules/users/entities/user_account.entity';
import { Contact } from 'src/modules/users/entities/contact.entity';
import { CommonModule } from 'src/common/common.module';
import { JwtModule } from '@nestjs/jwt';
import { RolesModule } from 'src/modules/roles/roles.module';

@Module({
  // import các entity để có thể inject vào service dùng, nếu không dùng thì không cần import
  imports: [
    TypeOrmModule.forFeature([UserAccount, Contact]),
    forwardRef(() => CommonModule),
    JwtModule,
    RolesModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, TypeOrmModule],
  // export UsersService để các module đã import UserModule sẽ có thể inject UsersService vào trong constructor được
  // export TypeOrmModule để các module đã import UserModule sẽ có thể inject Repository vào trong constructor
})
export class UsersModule {}
