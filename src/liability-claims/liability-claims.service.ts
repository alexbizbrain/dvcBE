import { Prisma, ClaimStatus, ClaimFlow } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { UsersService } from 'src/users/users.service';
import { Injectable } from '@nestjs/common';
import { EnsureUserResult } from './types/liability-claim.type';
import { CreateLiabilityClaimDto } from './dto/create-liability-claim.dto';

type OtpNotify = { channel: 'email' | 'phone'; contact: string; code: string };

@Injectable()
export class LiabilityClaimsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) { }

  private async ensureUserTx(
    tx: Prisma.TransactionClient,
    email?: string,
    phoneNumber?: string,
    countryCode?: string,
  ): Promise<EnsureUserResult> {
    if (!email && !phoneNumber) return { id: null, existed: false };

    if (email) {
      const u = await tx.user.findUnique({
        where: { email },
        select: { id: true },
      });
      if (u) return { id: u.id, existed: true };
    }

    if (phoneNumber) {
      const u = await tx.user.findUnique({
        where: { phoneNumber },
        select: { id: true },
      });
      if (u) return { id: u.id, existed: true };
    }

    const created = await tx.user.create({
      data: {
        email: email ?? null,
        phoneNumber: phoneNumber ?? null,
        countryCode: countryCode ?? '+1',
        isActive: true,
        role: { connect: { name: 'USER' } },
      },
      select: { id: true },
    });
    return { id: created.id, existed: false };
  }

  async create(dto: CreateLiabilityClaimDto) {
    try {
      const countryCode = dto.countryCode ?? 'us';

      const { ensuredUser, claim, otp } = await this.prisma.$transaction(
        async (tx) => {
          const ensuredUser = await this.ensureUserTx(
            tx,
            dto.email,
            dto.phoneNumber,
            countryCode,
          );

          // Create claim directly instead of liability claim
          const claim = await tx.claim.create({
            data: {
              userId: ensuredUser.id!,
              status: ClaimStatus.INPROGRESS,
              flow: ClaimFlow.LIABILITY_MODAL, // Track that this claim was created via liability modal
              currentStep: 1, // Start at step 2 since we have liability data
              lastAccessedAt: new Date(),
              // Pre-fill liability info from the payload
              liabilityInfo: {
                isAtFault: dto.atFaultDriver,
                state: dto.state,
                accidentState: dto.state, // Assuming same state for accident
              },
            },
          });

          let channel: 'email' | 'phone' | null = null;
          let contact: string | null = null;
          if (dto.email) {
            channel = 'email';
            contact = dto.email;
          } else if (dto.phoneNumber) {
            channel = 'phone';
            contact = dto.phoneNumber;
          }

          if (!channel && ensuredUser.id) {
            const u = await tx.user.findUnique({
              where: { id: ensuredUser.id },
              select: { email: true, phoneNumber: true },
            });
            if (u?.email) {
              channel = 'email';
              contact = u.email;
            } else if (u?.phoneNumber) {
              channel = 'phone';
              contact = u.phoneNumber;
            }
          }

          let otp: OtpNotify | null = null;

          if (ensuredUser.id && channel && contact) {
            const { code } = await this.usersService.issueOtpTx(
              tx,
              ensuredUser.id,
              channel,
            );
            otp = { channel, contact, code };
          }

          return { ensuredUser, claim, otp };
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );

      if (otp) {
        await this.usersService.notifyOtp(otp.channel, otp.contact, otp.code);
      }

      return {
        claim: this.mapClaimToResponse(claim),
        user: ensuredUser.id
          ? { id: ensuredUser.id, existed: ensuredUser.existed }
          : null,
        developmentOtp:
          process.env.NODE_ENV === 'development' && otp ? otp.code : undefined,
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  private mapClaimToResponse(claim: any) {
    // Extract JSON data with fallback to empty objects
    const vehicleInfo = claim.vehicleInfo || {};
    const accidentInfo = claim.accidentInfo || {};
    const insuranceInfo = claim.insuranceInfo || {};
    const pricingPlan = claim.pricingPlan || {};

    return {
      id: claim.id,
      currentStep: claim.currentStep,
      isSubmitted: claim.status === ClaimStatus.DV_CLAIM_CREATED,
      status: claim.status,
      flow: claim.flow,
      lastAccessedAt: claim.lastAccessedAt,
      vehicleInfo: {
        year: vehicleInfo.year || vehicleInfo.vehicleYear,
        make: vehicleInfo.make || vehicleInfo.vehicleMake,
        model: vehicleInfo.model || vehicleInfo.vehicleModel,
        vin: vehicleInfo.vin || vehicleInfo.vehicleVin,
        mileage: vehicleInfo.mileage || vehicleInfo.vehicleMileage,
        approximateCarPrice: vehicleInfo.approximateCarPrice,
        isCommercialVehicle: vehicleInfo.isCommercialVehicle,
      },
      accidentInfo: {
        accidentDate: accidentInfo.accidentDate,
        isAtFault: accidentInfo.isAtFault,
        isRepaired: accidentInfo.isRepaired,
        repairCost: accidentInfo.repairCost,
        repairInvoiceFileName: accidentInfo.repairInvoiceFileName,
        repairInvoiceFileUrl: accidentInfo.repairInvoiceFileUrl,
        nextAction: accidentInfo.nextAction,
        hasRepairEstimate: accidentInfo.hasRepairEstimate,
      },
      insuranceInfo: {
        firstName: insuranceInfo.firstName,
        lastName: insuranceInfo.lastName,
        email: insuranceInfo.email,
        phone: insuranceInfo.phone,
        address: insuranceInfo.address,
        claimNumber: insuranceInfo.claimNumber,
        atFaultInsurance: insuranceInfo.atFaultInsurance,
        adjusterName: insuranceInfo.adjusterName,
        adjusterEmail: insuranceInfo.adjusterEmail,
        adjusterPhone: insuranceInfo.adjusterPhone,
        adjusterCountryCode: insuranceInfo.adjusterCountryCode,
        driverName: insuranceInfo.driverName,
        driverEmail: insuranceInfo.driverEmail,
        driverPhone: insuranceInfo.driverPhone,
        driverCountryCode: insuranceInfo.driverCountryCode,
        autoInsuranceCardFileName: accidentInfo.autoInsuranceCardFileName,
        driverLicenseFrontFileName: accidentInfo.driverLicenseFrontFileName,
        autoInsuranceCardFileUrl: accidentInfo.autoInsuranceCardFileUrl,
        driverLicenseFrontFileUrl: accidentInfo.driverLicenseFrontFileUrl,
        driverLicenseBackFileName: accidentInfo.driverLicenseBackFileName,
        driverLicenseBackFileUrl: accidentInfo.driverLicenseBackFileUrl,
      },
      pricingPlan: {
        selectedPlan: pricingPlan.selectedPlan,
        agreedToTerms: pricingPlan.agreedToTerms,
        signatureDataUrl: pricingPlan.signatureDataUrl,
      },
      liabilityInfo: {
        isAtFault: claim.liabilityInfo?.isAtFault,
        accidentState: claim.liabilityInfo?.accidentState,
      },
      createdAt: claim.createdAt,
      updatedAt: claim.updatedAt,
    };
  }
}
