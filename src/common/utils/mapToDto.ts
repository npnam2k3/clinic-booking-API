import { plainToInstance } from 'class-transformer';

// T generic: class của DTO
// V generic: dữ liệu gốc (entity hoặc plain object)
export function toDTO<T, V>(DtoClass: new () => T, data: V | V[]): T | T[] {
  return plainToInstance(DtoClass, data, {
    excludeExtraneousValues: true,
  });
}
