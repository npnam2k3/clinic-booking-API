import { plainToInstance } from 'class-transformer';

// T generic: class của DTO
// V generic: dữ liệu gốc (entity hoặc plain object)
export function toDTO<T, V>(DtoClass: new () => T, data: V | V[]): T | T[] {
  return plainToInstance(DtoClass, data, {
    excludeExtraneousValues: true,
  });
}

export function removeEmptyFields<T extends object>(dto: T): Partial<T> {
  const cleanDto: Partial<T> = {};
  for (const key in dto) {
    const value = dto[key];
    if (value !== '' && value !== null && value !== undefined) {
      cleanDto[key] = value;
    }
  }
  return cleanDto;
}
