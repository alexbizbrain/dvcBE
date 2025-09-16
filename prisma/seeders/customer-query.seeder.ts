import { Seeder } from './seeder.interface';
import { PrismaClient } from '@prisma/client';

const sampleCustomerQueries = [
  {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phoneNumber: '55555501',
    countryCode: '+1',
    message: 'I would like to know more about the liability claim process.',
  },
  {
    firstName: 'Emma',
    lastName: 'Smith',
    email: 'emma.smith@example.com',
    phoneNumber: '55555502',
    countryCode: '+1',
    message: 'Can you help me file a claim for a car accident?',
  },
  {
    firstName: 'Liam',
    lastName: 'Johnson',
    email: 'liam.johnson@example.com',
    phoneNumber: '55555503',
    countryCode: '+1',
    message: 'Do you offer services outside the United States?',
  },
  {
    firstName: 'Sophia',
    lastName: 'Brown',
    email: 'sophia.brown@example.com',
    phoneNumber: '55555504',
    countryCode: '+1',
    message: 'I need urgent assistance with a settlement case.',
  },
  {
    firstName: 'Noah',
    lastName: 'Davis',
    email: 'noah.davis@example.com',
    phoneNumber: '55555505',
    countryCode: '+1',
    message: 'How long does it usually take to resolve a case?',
  },
];

export class CustomerQuerySeeder implements Seeder {
  async run(prisma: PrismaClient): Promise<void> {
    console.log('Seeding customer queries...');

    for (const query of sampleCustomerQueries) {
      const existing = await prisma.customerQuery.findFirst({
        where: {
          email: query.email,
          message: query.message,
        },
      });

      if (existing) {
        await prisma.customerQuery.update({
          where: { id: existing.id },
          data: query,
        });
      } else {
        await prisma.customerQuery.create({ data: query });
      }
    }

    console.log('✅ Customer queries seeded successfully!');
  }
}
