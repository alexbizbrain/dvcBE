import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateLiabilityClaimDto } from './dto/create-liability-claim.dto';

@Injectable()
export class LiabilityClaimsService {
  constructor(private prisma: PrismaService) {}

  async create(createLiabilityClaimDto: CreateLiabilityClaimDto) {
    const { atFaultDriver, ...rest } = createLiabilityClaimDto;

    // Validate that either email or phone is provided
    if (!rest.email && !rest.phoneNumber) {
      throw new BadRequestException('Either email or phone number is required');
    }

    // Convert atFaultDriver string to boolean
    const atFaultDriverBool = atFaultDriver === 'yes';

    try {
      const liabilityClaim = await this.prisma.liabilityClaim.create({
        data: {
          ...rest,
          atFaultDriver: atFaultDriverBool,
          countryCode: rest.countryCode || 'us',
          agreeToEmails: rest.agreeToEmails || false,
          agreeToSms: rest.agreeToSms || false,
        },
      });

      return liabilityClaim;
    } catch (error) {
      throw new BadRequestException('Failed to create liability claim');
    }
  }

  async findAll() {
    return this.prisma.liabilityClaim.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const claim = await this.prisma.liabilityClaim.findUnique({
      where: { id },
    });

    if (!claim) {
      throw new BadRequestException('Liability claim not found');
    }

    return claim;
  }
}
