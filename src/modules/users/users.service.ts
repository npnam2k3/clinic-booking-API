import { ConflictException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { UserAccount } from 'src/modules/users/entities/user_account.entity';
import { DataSource, Repository } from 'typeorm';
import { Contact } from 'src/modules/users/entities/contact.entity';
import { ERROR_MESSAGE } from 'src/common/constants/exception.message';
import { hashPassword } from 'src/common/utils/handle_password';
import { RolesService } from 'src/modules/roles/roles.service';
import { UserResponseDTO } from 'src/modules/users/dto/response-user.dto';
import { Role } from 'src/modules/users/enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserAccount)
    private readonly userRepo: Repository<UserAccount>,

    @InjectRepository(Contact)
    private readonly contactRepo: Repository<Contact>,

    private readonly datasource: DataSource,

    private readonly roleService: RolesService,
  ) {}

  // hàm tạo mới nhân viên - quyền admin thực hiện
  async createStaff(createUserDto: CreateUserDto): Promise<UserResponseDTO> {
    // kiểm tra trùng thông tin số điện thoại
    const checkDuplicatePhone = await this.contactRepo.count({
      where: {
        phone_number: createUserDto.phone_number,
      },
    });
    if (checkDuplicatePhone)
      throw new ConflictException(ERROR_MESSAGE.PHONE_NUMBER_EXISTS);

    // kiểm tra trùng thông tin email
    const checkDuplicateEmail = await this.userRepo.count({
      where: {
        email: createUserDto.email,
      },
    });
    if (checkDuplicateEmail)
      throw new ConflictException(ERROR_MESSAGE.EMAIL_EXISTS);

    return await this.datasource.transaction(
      async (manager): Promise<UserResponseDTO> => {
        const hashedPassword = await hashPassword(createUserDto.password);
        const roleFound = await this.roleService.findRoleByName(Role.STAFF);

        const newStaffAccount = manager.create(UserAccount, {
          email: createUserDto.email,
          hashed_password: hashedPassword,
          role: roleFound,
        });

        await manager.save(UserAccount, newStaffAccount);

        const newContact = manager.create(Contact, {
          fullname: createUserDto.fullname,
          phone_number: createUserDto.phone_number,
          address: createUserDto.address,
          user_account: newStaffAccount,
        });
        await manager.save(Contact, newContact);

        return {
          user_id: newStaffAccount.user_id,
          email: newStaffAccount.email,
          is_block: newStaffAccount.is_block,
          contact: {
            contact_id: newContact.contact_id,
            phone_number: newContact.phone_number,
            fullname: newContact.fullname,
            address: newContact.address,
            created_at: newContact.createdAt,
          },
          role: newStaffAccount.role,
        };
      },
    );
  }

  // hàm đăng ký tài khoản khách hàng - không cần quyền
  async createUserClient(
    createUserDto: CreateUserDto,
  ): Promise<UserResponseDTO> {
    // kiểm tra trùng thông tin số điện thoại
    const checkDuplicatePhone = await this.contactRepo.count({
      where: {
        phone_number: createUserDto.phone_number,
      },
    });
    if (checkDuplicatePhone)
      throw new ConflictException(ERROR_MESSAGE.PHONE_NUMBER_EXISTS);

    // kiểm tra trùng thông tin email
    const checkDuplicateEmail = await this.userRepo.count({
      where: {
        email: createUserDto.email,
      },
    });
    if (checkDuplicateEmail)
      throw new ConflictException(ERROR_MESSAGE.EMAIL_EXISTS);

    return await this.datasource.transaction(
      async (manager): Promise<UserResponseDTO> => {
        const hashedPassword = await hashPassword(createUserDto.password);
        const roleFound = await this.roleService.findRoleByName(
          Role.USER_CLIENT,
        );

        const newUserClientAccount = manager.create(UserAccount, {
          email: createUserDto.email,
          hashed_password: hashedPassword,
          role: roleFound,
        });

        await manager.save(UserAccount, newUserClientAccount);

        const newContact = manager.create(Contact, {
          fullname: createUserDto.fullname,
          phone_number: createUserDto.phone_number,
          address: createUserDto.address,
          user_account: newUserClientAccount,
        });
        await manager.save(Contact, newContact);

        return {
          user_id: newUserClientAccount.user_id,
          email: newUserClientAccount.email,
          is_block: newUserClientAccount.is_block,
          contact: {
            contact_id: newContact.contact_id,
            phone_number: newContact.phone_number,
            fullname: newContact.fullname,
            address: newContact.address,
            created_at: newContact.createdAt,
          },
          role: newUserClientAccount.role,
        };
      },
    );
  }

  findAll() {
    return `This action returns all users`;
  }

  async findOne(id: number) {
    const user = await this.userRepo.findOne({
      where: {
        user_id: id,
      },
      relations: {
        role: true,
      },
    });
    return user;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
