import { PrismaClient } from '@prisma/client';

export interface Seeder {
  run(prisma: PrismaClient): Promise<void>;
}
