import { Seeder } from './seeder.interface';
import { PrismaClient } from '@prisma/client';

const sampleReviews = [
  {
    customerName: 'Rihana. RK',
    customerInitials: 'RK',
    rating: 5,
    reviewText:
      "I chose the pay-later option because I didn't want to risk anything. They handled everything and got me paid. Super professional and responsive.",
    source: 'Trustpilot',
    displayOrder: 1,
  },
  {
    customerName: 'Michael Johnson',
    customerInitials: 'MJ',
    rating: 5,
    reviewText:
      'Excellent service! They made the whole process so easy and stress-free. Got my settlement faster than expected.',
    source: 'Google',
    displayOrder: 2,
  },
  {
    customerName: 'Sarah Williams',
    customerInitials: 'SW',
    rating: 4,
    reviewText:
      'Very helpful team. They kept me informed throughout the entire process and answered all my questions promptly.',
    source: 'Website',
  },
  {
    customerName: 'David Chen',
    customerInitials: 'DC',
    rating: 5,
    reviewText:
      'Professional and efficient. I was worried about the legal process but they handled everything perfectly.',
    source: 'Trustpilot',
    displayOrder: 3,
  },
  {
    customerName: 'Emily Rodriguez',
    customerInitials: 'ER',
    rating: 5,
    reviewText:
      'Outstanding experience from start to finish. They truly care about their clients and it shows.',
    source: 'Google',
  },
  {
    customerName: 'James Wilson',
    customerInitials: 'JW',
    rating: 4,
    reviewText:
      'Great communication throughout the process. They made a stressful situation much easier to handle.',
    source: 'Trustpilot',
  },
  {
    customerName: 'Lisa Thompson',
    customerInitials: 'LT',
    rating: 5,
    reviewText:
      'Highly recommend! They fought hard for my case and got me a fair settlement. Very professional team.',
    source: 'Google',
    displayOrder: 4,
  },
];

export class ReviewSeeder implements Seeder {
  async run(prisma: PrismaClient): Promise<void> {
    console.log('Seeding reviews...');

    for (const review of sampleReviews) {
      const existing = await prisma.review.findFirst({
        where: { customerName: review.customerName, source: review.source },
      });

      if (existing) {
        await prisma.review.update({
          where: { id: existing.id },
          data: review,
        });
      } else {
        await prisma.review.create({ data: review });
      }
    }

    console.log('✅ Reviews seeded successfully!');
  }
}
