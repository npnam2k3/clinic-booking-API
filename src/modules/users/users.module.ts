import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserAccount } from 'src/modules/users/entities/user_account.entity';
import { Contact } from 'src/modules/users/entities/contact.entity';

@Module({
  // import các entity để có thể inject vào service dùng, nếu không dùng thì không cần import
  imports: [TypeOrmModule.forFeature([UserAccount, Contact])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
