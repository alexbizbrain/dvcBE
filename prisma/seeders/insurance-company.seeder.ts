import { Seeder } from './seeder.interface';
import { InsuranceCompany, PrismaClient } from '@prisma/client';
import { InsuranceType } from '@prisma/client';

const companies: InsuranceCompany[] = [
  {
    companyName: 'GEICO',
    contactEmail: 'support@geico.com',
    insuranceType: InsuranceType.AUTO,
    naic: '35882',
    websiteUrl: 'https://www.geico.com',
    id: '',
    companyLicensed: null,
    companyInformation: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    companyName: 'State Farm',
    contactEmail: 'support@statefarm.com',
    insuranceType: InsuranceType.AUTO,
    naic: '25178',
    websiteUrl: 'https://www.statefarm.com',
    id: '',
    companyLicensed: null,
    companyInformation: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    companyName: 'Progressive',
    contactEmail: 'support@progressive.com',
    insuranceType: InsuranceType.AUTO,
    naic: '24260',
    websiteUrl: 'https://www.progressive.com',
    id: '',
    companyLicensed: null,
    companyInformation: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  // add more as needed...
];

export class InsuranceCompanySeeder implements Seeder {
  async run(prisma: PrismaClient): Promise<void> {
    console.log('Seeding insurance companies...');

    for (const ic of companies) {
      await prisma.insuranceCompany.upsert({
        where: {
          id: ic.id,
          companyName: ic.companyName,
          insuranceType: ic.insuranceType,
        },
        update: {
          contactEmail: ic.contactEmail,
          naic: ic.naic ?? null,
          websiteUrl: ic.websiteUrl ?? null,
          companyLicensed: ic.companyLicensed ?? undefined,
          companyInformation: ic.companyInformation ?? undefined,
        },
        create: {
          companyName: ic.companyName,
          contactEmail: ic.contactEmail,
          insuranceType: ic.insuranceType,
          naic: ic.naic ?? null,
          websiteUrl: ic.websiteUrl ?? null,
          companyLicensed: ic.companyLicensed ?? undefined,
          companyInformation: ic.companyInformation ?? null,
        },
      });
    }

    console.log('✅ Insurance companies seeded successfully!');
  }
}
