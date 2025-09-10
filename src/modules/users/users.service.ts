import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { UserAccount } from 'src/modules/users/entities/user_account.entity';
import { DataSource, Not, Repository } from 'typeorm';
import { Contact } from 'src/modules/users/entities/contact.entity';
import { ERROR_MESSAGE } from 'src/common/constants/exception.message';
import { hashPassword } from 'src/common/utils/handle_password';
import { RolesService } from 'src/modules/roles/roles.service';
import { UserResponseDTO } from 'src/modules/users/dto/response-user.dto';
import { Role } from 'src/modules/users/enum';
import { removeEmptyFields, toDTO } from 'src/common/utils/mapToDto';

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

  // hàm lấy danh sách thông tin tài khoản khách hàng - quyền admin, staff
  async findAllUserClient({ pageNum, limitNum, keyword }) {
    // thứ tự thực hiện câu truy vấn sql: search => order => pagination
    const queryBuilder = this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('user.contact', 'contact')
      // chỉ lấy theo role = user client
      .where('role.role_name = :roleName', {
        roleName: Role.USER_CLIENT,
      });

    //1. search
    if (keyword) {
      queryBuilder.andWhere('contact.fullname LIKE :keyword', {
        keyword: `%${keyword}%`,
      });
    }

    //2. sort
    queryBuilder.orderBy(`user.createdAt`, 'DESC');

    //3. pagination
    const totalRecords = await queryBuilder.getCount();
    const users = await queryBuilder
      .skip((pageNum - 1) * limitNum)
      .take(limitNum)
      .select([
        'user.user_id',
        'user.email',
        'user.createdAt',
        'role',
        'contact.phone_number',
        'contact.address',
        'contact.fullname',
      ])
      .getMany();

    return {
      users,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limitNum),
      conditions: {
        pageNum,
        limitNum,
        keyword,
      },
    };
  }

  // hàm lấy danh sách thông tin tài khoản nhân viên - quyền admin
  async findAllStaff(): Promise<UserResponseDTO[]> {
    const listStaff = await this.userRepo.find({
      where: {
        role: {
          role_name: Role.STAFF,
        },
      },
      relations: {
        role: true,
        contact: true,
      },
    });
    return toDTO(UserResponseDTO, listStaff) as UserResponseDTO[];
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

  // hàm lấy thông tin chi tiết tài khoản khách hàng - quyền admin, staff
  async getDetailUserClient(userId: number) {
    const userFound = await this.userRepo.findOne({
      where: {
        user_id: userId,
      },
      relations: {
        contact: true,
        role: true,
      },
    });
    if (!userFound) throw new NotFoundException(ERROR_MESSAGE.USER_NOT_FOUND);

    return {
      user_id: userFound.user_id,
      email: userFound.email,
      fullname: userFound.contact.fullname,
      phone_number: userFound.contact.phone_number,
      address: userFound.contact.address,
      is_block: userFound.is_block,
      createdAt: userFound.createdAt,
      patients: userFound.contact.patients || [],
      reviews: userFound.contact.reviews || [],
      role: userFound.role.role_name,
      appointment_cancellations: userFound.appointment_cancellations || [],
    };
  }

  // hàm lấy thông tin chi tiết tài khoản nhân viên - quyền admin
  async getDetailStaff(userId: number) {
    const staffFound = await this.userRepo.findOne({
      where: {
        user_id: userId,
      },
      relations: {
        contact: true,
        role: true,
      },
    });
    if (!staffFound) throw new NotFoundException(ERROR_MESSAGE.USER_NOT_FOUND);

    return {
      user_id: staffFound.user_id,
      email: staffFound.email,
      fullname: staffFound.contact.fullname,
      phone_number: staffFound.contact.phone_number,
      address: staffFound.contact.address,
      is_block: staffFound.is_block,
      createdAt: staffFound.createdAt,
      role: staffFound.role.role_name,
      appointment_cancellations: staffFound.appointment_cancellations || [],
    };
  }

  // hàm cập nhật thông tin của staff và user - quyền Admin
  async update(id: number, updateUserDto: UpdateUserDto) {
    const cleanDto = removeEmptyFields(updateUserDto);

    if (Object.keys(cleanDto).includes('phone_number')) {
      const checkPhoneNumberExists = await this.contactRepo.count({
        where: {
          phone_number: updateUserDto.phone_number,
          user_account: { user_id: Not(id) },
        },
      });

      if (checkPhoneNumberExists > 0)
        throw new ConflictException(ERROR_MESSAGE.PHONE_NUMBER_EXISTS);
    }

    await this.contactRepo.update(
      {
        user_account: {
          user_id: id,
        },
      },
      cleanDto,
    );
  }

  // hàm xóa tài khoản khách và nhân viên - quyền Admin
  async remove(userId: number) {
    const userFound = await this.userRepo.findOne({
      where: {
        user_id: userId,
      },
      relations: {
        contact: true,
      },
    });

    if (!userFound) throw new NotFoundException(ERROR_MESSAGE.USER_NOT_FOUND);

    await this.userRepo.softRemove(userFound);
  }
}
