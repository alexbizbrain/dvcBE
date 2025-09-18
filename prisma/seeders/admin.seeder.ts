import * as bcrypt from 'bcryptjs';

import { Seeder } from './seeder.interface';
import { PrismaClient } from '@prisma/client';

export class AdminSeeder implements Seeder {
  async run(prisma: PrismaClient): Promise<void> {
    console.log('Creating admin user...');

    const hashedPassword = await bcrypt.hash('Admin@123', 10);

    const adminRole = await prisma.role.findUnique({
      where: { name: 'ADMIN' },
    });
    if (!adminRole) {
      throw new Error('Admin role not found. Run RoleSeeder first.');
    }

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
  }
}
