import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateSpecialtyDto } from './dto/create-specialty.dto';
import { UpdateSpecialtyDto } from './dto/update-specialty.dto';
import { Not, Repository } from 'typeorm';
import { Specialty } from 'src/modules/specialties/entities/specialty.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ERROR_MESSAGE } from 'src/common/constants/exception.message';
import { SpecialtyResponseDto } from 'src/modules/specialties/dto/response-specialty.dto';
import { toDTO } from 'src/common/utils/mapToDto';

@Injectable()
export class SpecialtiesService {
  constructor(
    @InjectRepository(Specialty)
    private readonly specialtyRepo: Repository<Specialty>,
  ) {}
  async create(
    createSpecialtyDto: CreateSpecialtyDto,
  ): Promise<SpecialtyResponseDto> {
    const checkNameExists = await this.specialtyRepo.count({
      where: {
        specialization_name: createSpecialtyDto.specialization_name,
      },
    });

    if (checkNameExists > 0)
      throw new ConflictException(ERROR_MESSAGE.DUPLICATE_SPECIALIZATION_NAME);

    const newSpecialization = this.specialtyRepo.create({
      specialization_name: createSpecialtyDto.specialization_name,
      description: createSpecialtyDto.description,
    });
    await this.specialtyRepo.save(newSpecialization);
    return toDTO(
      SpecialtyResponseDto,
      newSpecialization,
    ) as SpecialtyResponseDto;
  }

  async findAll(): Promise<SpecialtyResponseDto[]> {
    const listSpecialties = await this.specialtyRepo.find();
    return toDTO(
      SpecialtyResponseDto,
      listSpecialties,
    ) as SpecialtyResponseDto[];
  }

  async findOne(id: number) {
    const specializationFound = await this.specialtyRepo.findOne({
      where: {
        specialization_id: id,
      },
      relations: {
        doctors: true,
      },
    });
    if (!specializationFound)
      throw new NotFoundException(ERROR_MESSAGE.SPECIALIZATION_NOT_FOUND);

    return {
      specialization_id: specializationFound.specialization_id,
      specialization_name: specializationFound.specialization_name,
      description: specializationFound.description,
      created_at: specializationFound.createdAt,
      doctors: specializationFound.doctors || [],
    };
  }

  async update(id: number, updateSpecialtyDto: UpdateSpecialtyDto) {
    if (Object.keys(updateSpecialtyDto).includes('specialization_name')) {
      const checkNameExists = await this.specialtyRepo.count({
        where: {
          specialization_name: updateSpecialtyDto.specialization_name,
          specialization_id: Not(id),
        },
      });
      if (checkNameExists > 0)
        throw new ConflictException(
          ERROR_MESSAGE.DUPLICATE_SPECIALIZATION_NAME,
        );
    }
    await this.specialtyRepo.update(id, updateSpecialtyDto);
  }

  async remove(id: number) {
    const specializationFound = await this.specialtyRepo.findOne({
      where: {
        specialization_id: id,
      },
    });
    if (!specializationFound)
      throw new NotFoundException(ERROR_MESSAGE.SPECIALIZATION_NOT_FOUND);

    await this.specialtyRepo.softRemove(specializationFound);
  }
}
