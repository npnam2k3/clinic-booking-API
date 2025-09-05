import { hashPassword } from 'src/common/utils/handle_password';
import { Role } from '../../modules/roles/entities/role.entity';
import { UserAccount } from '../../modules/users/entities/user_account.entity';
import { DataSource } from 'typeorm';

export async function userSeeder(dataSource: DataSource) {
  const userRepo = dataSource.getRepository(UserAccount);
  const roleRepo = dataSource.getRepository(Role);

  const role = roleRepo.create({ role_name: 'ADMIN' });
  await roleRepo.save(role);

  const hashed_password = await hashPassword('Admin123@');
  const user_account = userRepo.create({
    email: 'hoangpham6641@gmail.com',
    hashed_password,
    role,
  });
  await userRepo.save(user_account);
  console.log('✅ User Seeder done');
}
