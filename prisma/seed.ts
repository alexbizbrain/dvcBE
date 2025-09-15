import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create roles
  console.log('Creating roles...');
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      name: 'ADMIN',
      isActive: true,
    },
  });

  const userRole = await prisma.role.upsert({
    where: { name: 'USER' },
    update: {},
    create: {
      name: 'USER',
      isActive: true,
    },
  });

  console.log('✅ Roles created:', {
    adminRole: adminRole.name,
    userRole: userRole.name,
  });

  // Create admin user
  console.log('Creating admin user...');
  const hashedPassword = await bcrypt.hash('Admin@123', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@dvcc.com' },
    update: {},
    create: {
      email: 'admin@dvcc.com',
      firstName: 'Admin',
      lastName: 'User',
      password: hashedPassword,
      isEmailVerified: true,
      isActive: true,
      roleId: adminRole.id,
    },
  });

  console.log('✅ Admin user created:', {
    id: adminUser.id,
    email: adminUser.email,
    name: `${adminUser.firstName} ${adminUser.lastName}`,
  });

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📋 Admin Login Credentials:');
  console.log('Email: admin@dvcc.com');
  console.log('Password: Admin@123');
  console.log('\n⚠️  Please change the default password after first login!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
