import { PrismaClient } from '@prisma/client';
import { RoleSeeder } from './seeders/role.seeder';
import { AdminSeeder } from './seeders/admin.seeder';
import { ReviewSeeder } from './seeders/review.seeder';
import { CustomerQuerySeeder } from './seeders/customer-query.seeder';
import { InsuranceCompanySeeder } from './seeders/insurance-company.seeder';

async function main() {
  const prisma = new PrismaClient();

  try {
    console.log('🌱 Starting seed...');
    try {
      const dbUrl = process.env.DATABASE_URL || '';
      const u = new URL(dbUrl);
      const masked = `${u.protocol}//${u.hostname}:${u.port || ''}/${u.pathname.replace('/', '')}`;
      console.log('🗄️  Database:', masked || '(unknown)');
    } catch {
      // ignore
    }

    const seeders = [
      new RoleSeeder(),
      new AdminSeeder(),
      new ReviewSeeder(),
      new CustomerQuerySeeder(),
      new InsuranceCompanySeeder(),
      // Add more seeders here
    ];

    for (const seeder of seeders) {
      await seeder.run(prisma);
    }

    console.log('\n🎉 Seed completed successfully!');
    console.log('\n📋 Admin Login Credentials:');
    console.log('Email: admin@dvcc.com');
    console.log('Password: Admin@123');
    console.log('\n⚠️  Please change the default password after first login!');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
