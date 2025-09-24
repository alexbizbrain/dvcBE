import { Seeder } from './seeder.interface';
import { PrismaClient } from '@prisma/client';

const sampleInsuranceCompanies = [
  {
    name: 'Allstate',
    contactEmail: 'customerservice@allstate.com',  // Example / placeholder
    addedBy: 'system',
  },
  {
    name: 'GEICO',
    contactEmail: 'overseas@geico.com',  // Found on GEICO site for overseas contact :contentReference[oaicite:0]{index=0}
    addedBy: 'system',
  },
  {
    name: 'Liberty Mutual',
    contactEmail: 'customerservice@libertymutual.com',  // Example / placeholder
    addedBy: 'system',
  },
  {
    name: 'Progressive',
    contactEmail: 'general_inquiry@progressive.com',  // Example / placeholder
    addedBy: 'system',
  },
  {
    name: 'The Hartford',
    contactEmail: 'customer_service@thehartford.com',  // Example / placeholder
    addedBy: 'system',
  },
  {
    name: 'Mercury Insurance',
    contactEmail: 'customerservice@mercuryinsurance.com', // Example / placeholder
    addedBy: 'system',
  },
];

export class InsuranceCompanySeeder implements Seeder {
  async run(prisma: PrismaClient): Promise<void> {
    console.log('Seeding insurance companies...');

    for (const ic of sampleInsuranceCompanies) {
      const existing = await prisma.insuranceCompany.findFirst({
        where: {
          name: ic.name,
        },
      });

      if (existing) {
        await prisma.insuranceCompany.update({
          where: { id: existing.id },
          data: ic,
        });
      } else {
        await prisma.insuranceCompany.create({ data: ic });
      }
    }

    console.log('✅ Insurance companies seeded successfully!');
  }
}
