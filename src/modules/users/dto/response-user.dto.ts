import { Expose, Type } from 'class-transformer';

class RoleResponseDTO {
  @Expose()
  role_name: string;
}
export class ContactResponseDTO {
  @Expose()
  contact_id: number;

  @Expose()
  phone_number: string;

  @Expose()
  address: string;

  @Expose()
  fullname: string;

  @Expose({ name: 'createdAt' })
  created_at: Date;
}
export class UserResponseDTO {
  @Expose()
  user_id: number;

  @Expose()
  email: string;

  @Expose()
  is_block: boolean;

  @Expose()
  @Type(() => RoleResponseDTO)
  role: RoleResponseDTO;

  @Expose()
  @Type(() => ContactResponseDTO)
  contact: ContactResponseDTO;
}
