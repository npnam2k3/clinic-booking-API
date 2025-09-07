import { hashPassword } from 'src/common/utils/handle_password';
import { Role } from '../../modules/roles/entities/role.entity';
import { UserAccount } from '../../modules/users/entities/user_account.entity';
import { DataSource } from 'typeorm';

export async function userSeeder(dataSource: DataSource) {
  const userRepo = dataSource.getRepository(UserAccount);
  const roleRepo = dataSource.getRepository(Role);

  // const role = roleRepo.create({ role_name: 'ADMIN' });
  const roleStaff = roleRepo.create({ role_name: 'STAFF' });
  const roleClient = roleRepo.create({ role_name: 'USER_CLIENT' });
  // await roleRepo.save(role);
  await roleRepo.save(roleStaff);
  await roleRepo.save(roleClient);

  // const hashed_password = await hashPassword('Admin123@');
  const hashed_passwordStaff = await hashPassword('Staff123@');
  const hashed_passwordClient = await hashPassword('User123@');
  // const user_account = userRepo.create({
  //   email: 'hoangpham6641@gmail.com',
  //   hashed_password,
  //   role,
  // });
  const user_staff = userRepo.create({
    email: 'staff1@gmail.com',
    hashed_password: hashed_passwordStaff,
    role: roleStaff,
  });
  const user_client = userRepo.create({
    email: 'client1@gmail.com',
    hashed_password: hashed_passwordClient,
    role: roleClient,
  });
  // await userRepo.save(user_account);
  await userRepo.save(user_staff);
  await userRepo.save(user_client);
  console.log('✅ User Seeder done');
}
