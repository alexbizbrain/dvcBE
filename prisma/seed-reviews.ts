// scripts/seed-reviews.ts (Sample data seeder)
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

async function seedReviews() {
  console.log('Seeding reviews...');

  for (const review of sampleReviews) {
    await prisma.review.create({
      data: review,
    });
  }

  console.log('Reviews seeded successfully!');
}

async function main() {
  try {
    await seedReviews();
  } catch (error) {
    console.error('Error seeding reviews:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

export { seedReviews };
