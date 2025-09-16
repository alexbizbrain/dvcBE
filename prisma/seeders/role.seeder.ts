// prisma/seeders/role.seeder.ts
import { PrismaClient } from '@prisma/client';
import { Seeder } from './seeder.interface';

export class RoleSeeder implements Seeder {
  async run(prisma: PrismaClient): Promise<void> {
    console.log('Creating roles...');

    const adminRole = await prisma.role.upsert({
      where: { name: 'ADMIN' },
      update: {},
      create: { name: 'ADMIN', isActive: true },
    });

    const userRole = await prisma.role.upsert({
      where: { name: 'USER' },
      update: {},
      create: { name: 'USER', isActive: true },
    });

    console.log('✅ Roles created:', {
      adminRole: adminRole.name,
      userRole: userRole.name,
    });
  }
}
