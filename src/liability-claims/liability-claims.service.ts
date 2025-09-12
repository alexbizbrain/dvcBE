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
    
    // Check eligibility based on frontend criteria (lines 103-114)
    const isStateRestricted = rest.state === "New York" || rest.state === "North Carolina";
    const isAtFault = atFaultDriver === "yes";
    const isEligible = !isStateRestricted && !isAtFault;

    try {
      let userId: string = "";

      // If eligible, create or find user
      if (isEligible) {
        // Check if user already exists
        const existingUser = await this.prisma.user.findFirst({
          where: {
            OR: [
              rest.email ? { email: rest.email } : {},
              rest.phoneNumber ? { phoneNumber: rest.phoneNumber } : {}
            ].filter(condition => Object.keys(condition).length > 0)
          }
        });

        if (existingUser) {
          userId = existingUser.id;
        } else {
          // Get or create default USER role
          let userRole = await this.prisma.role.findFirst({
            where: { name: 'USER' }
          });
          
          if (!userRole) {
            userRole = await this.prisma.role.create({
              data: {
                name: 'USER',
                isActive: true
              }
            });
          }
          console.log("rest.phoneNumber")
          console.log(rest.phoneNumber)

          // Create new user
          const newUser = await this.prisma.user.create({
            data: {
              email: rest.email,
              phoneNumber: rest.phoneNumber,
              countryCode: rest.countryCode === 'us' ? '+1' : rest.countryCode,
              roleId: userRole.id,
              isBusinessUser: false,
            }
          });
          
          userId = newUser.id;
        }
      }

      const liabilityClaim = await this.prisma.liabilityClaim.create({
        data: {
          ...rest,
          atFaultDriver: atFaultDriverBool,
          countryCode: rest.countryCode || 'us',
          hitAndRun: rest.hitAndRun || false,
          agreeToEmails: rest.agreeToEmails || false,
          agreeToSms: rest.agreeToSms || false,
        },
      });

      return liabilityClaim;
    } catch (error) {
      console.error('Error creating liability claim:', error);
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
