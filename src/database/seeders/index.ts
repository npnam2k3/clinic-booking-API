// src/database/seeder/index.ts
import { userSeeder } from './user_account.seeder';
import { DataSource } from 'typeorm';

const dataSource = new DataSource({
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: '123456',
  database: 'clinic_booking_db',
  entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
});

async function runSeeder() {
  await dataSource.initialize();
  await userSeeder(dataSource);
  await dataSource.destroy();
}

runSeeder()
  .then(() => console.log('🌱 Seeding finished'))
  .catch((err) => console.error(err));
