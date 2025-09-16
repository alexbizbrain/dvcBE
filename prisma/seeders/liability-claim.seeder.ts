import { Seeder } from './seeder.interface';
import { PrismaClient } from '@prisma/client';

export class LiabilityClaimSeeder implements Seeder {
  async run(prisma: PrismaClient): Promise<void> {
    console.log('Seeding liability claims...');

    const sampleLiabilityClaims = [
      {
        email: 'john.doe@example.com',
        phoneNumber: '',
        countryCode: 'us',
        atFaultDriver: true,
        state: 'Alabama',
        hitAndRun: false,
        agreeToEmails: true,
        agreeToSms: false,
      },
      {
        email: 'jane.smith@example.com',
        phoneNumber: '',
        countryCode: 'us',
        atFaultDriver: false,
        state: 'Alaska',
        hitAndRun: true,
        agreeToEmails: true,
        agreeToSms: false,
      },
      {
        email: 'mark.jones@example.com',
        phoneNumber: '',
        countryCode: 'us',
        atFaultDriver: true,
        state: 'Louisiana',
        hitAndRun: false,
        agreeToEmails: true,
        agreeToSms: false,
      },
      {
        email: 'emily.lee@example.com',
        phoneNumber: '',
        countryCode: 'us',
        atFaultDriver: false,
        state: 'New York',
        hitAndRun: false,
        agreeToEmails: true,
        agreeToSms: false,
      },
      {
        email: 'alex.brown@example.com',
        phoneNumber: '',
        countryCode: 'us',
        atFaultDriver: true,
        state: 'North Carolina',
        hitAndRun: true,
        agreeToEmails: true,
        agreeToSms: false,
      },
    ];

    for (const claim of sampleLiabilityClaims) {
      const existing = await prisma.liabilityClaim.findFirst({
        where: { email: claim.email },
      });

      if (existing) {
        await prisma.liabilityClaim.update({
          where: { id: existing.id },
          data: claim,
        });
      } else {
        await prisma.liabilityClaim.create({
          data: claim,
        });
      }
    }

    console.log('✅ Liability claims seeded successfully!');
  }
}
