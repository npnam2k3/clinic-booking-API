import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Doctor } from 'src/modules/doctors/entities/doctor.entity';
import { ERROR_MESSAGE } from 'src/common/constants/exception.message';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { toDTO } from 'src/common/utils/mapToDto';
import { DoctorResponseDto } from 'src/modules/doctors/dto/doctor-response.dto';

@Injectable()
export class DoctorsService {
  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(Doctor)
    private readonly doctorRepo: Repository<Doctor>,

    private readonly cloudinaryService: CloudinaryService,
  ) {}
  async create(
    createDoctorDto: CreateDoctorDto,
    avatar: Express.Multer.File,
  ): Promise<DoctorResponseDto> {
    // kiểm tra phone trùng
    const checkPhoneDuplicate = await this.doctorRepo.count({
      where: {
        phone_number: createDoctorDto.phone_number,
      },
    });
    if (checkPhoneDuplicate > 0)
      throw new ConflictException(ERROR_MESSAGE.PHONE_NUMBER_EXISTS);

    // kiểm tra email trùng
    const checkEmailDuplicate = await this.doctorRepo.count({
      where: {
        email: createDoctorDto.email,
      },
    });
    if (checkEmailDuplicate > 0)
      throw new ConflictException(ERROR_MESSAGE.EMAIL_EXISTS);

    // tạo transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let uploadResult: { secure_url: string; public_id: string } | null = null;
    try {
      // upload file nếu có
      if (avatar) {
        uploadResult = await this.cloudinaryService.uploadFile(avatar);
      }

      // tạo mới doctor
      const newDoctor = queryRunner.manager.create(Doctor, {
        fullname: createDoctorDto.fullname,
        gender: createDoctorDto.gender,
        degree: createDoctorDto.degree,
        position: createDoctorDto.position,
        description: createDoctorDto.description,
        years_of_experience: createDoctorDto.years_of_experience,
        phone_number: createDoctorDto.phone_number,
        email: createDoctorDto.email,
        avatar_url: uploadResult?.secure_url,
        specialty: {
          specialization_id: createDoctorDto.specialization_id,
        },
      });
      await queryRunner.manager.save(newDoctor);

      // commit
      await queryRunner.commitTransaction();
      return toDTO(DoctorResponseDto, newDoctor) as DoctorResponseDto;
    } catch (error) {
      console.log('Check error::', error);
      // Nếu insert vào database lỗi => rollback transaction
      await queryRunner.rollbackTransaction();

      // Nếu Cloudinary đã upload thành công thì xóa đi
      if (uploadResult?.public_id) {
        await this.cloudinaryService.deleteFile(uploadResult.public_id);
      }
      throw new InternalServerErrorException(
        ERROR_MESSAGE.INTERNAL_ERROR_SERVER,
      );
    } finally {
      // đóng kết nối
      await queryRunner.release();
    }
  }

  findAll() {
    return `This action returns all doctors`;
  }

  findOne(id: number) {
    return `This action returns a #${id} doctor`;
  }

  update(id: number, updateDoctorDto: UpdateDoctorDto) {
    return `This action updates a #${id} doctor`;
  }

  remove(id: number) {
    return `This action removes a #${id} doctor`;
  }
}
