import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SaveProgressDto } from './dto/save-progress.dto';
import { CalculatorProgressResponseDto } from './dto/calculator-progress-response.dto';
import { ClaimStatus } from '@prisma/client';

@Injectable()
export class CalculatorProgressService {
  constructor(private readonly prisma: PrismaService) {}

  async getProgress(
    userId: string,
  ): Promise<CalculatorProgressResponseDto | null> {
    // Get the draft claim for the user
    const claim = await this.prisma.claim.findFirst({
      where: {
        userId,
        status: ClaimStatus.INPROGRESS,
      },
    });

    if (!claim) {
      return null;
    }

    return this.mapToResponseDto(claim);
  }

  async saveProgress(
    userId: string,
    data: SaveProgressDto,
  ): Promise<CalculatorProgressResponseDto> {
    // Check if user already has a draft claim
    const existingDraft = await this.prisma.claim.findFirst({
      where: {
        userId,
        status: ClaimStatus.INPROGRESS,
      },
    });

    // Prepare update data
    const updateData: any = {
      lastAccessedAt: new Date(),
    };

    // Update step tracking
    if (data.currentStep !== undefined) {
      updateData.currentStep = data.currentStep;
    }

    // Update status if provided
    if (data.status !== undefined) {
      updateData.status = data.status;
    }
    if (
      data.currentStep === 2 &&
      typeof existingDraft?.liabilityInfo === 'object' &&
      existingDraft?.liabilityInfo !== null &&
      (existingDraft.liabilityInfo as any).isAtFault
    ) {
      updateData.status = ClaimStatus.DISQUALIFIED;
    }
    if (
      data.currentStep === 2 &&
      typeof existingDraft?.accidentInfo === 'object' &&
      existingDraft?.accidentInfo !== null &&
      (existingDraft.accidentInfo as any).hitAndRun
    ) {
      updateData.status = ClaimStatus.DISQUALIFIED;
    }

    // Handle JSON field updates
    if (data.liabilityInfo) {
      updateData.liabilityInfo = this.mergeJsonField(
        existingDraft?.liabilityInfo as any,
        data.liabilityInfo,
      );
    }

    if (data.vehicleInfo) {
      updateData.vehicleInfo = this.mergeJsonField(
        existingDraft?.vehicleInfo as any,
        data.vehicleInfo,
      );
    }

    if (data.accidentInfo) {
      updateData.accidentInfo = this.mergeJsonField(
        existingDraft?.accidentInfo as any,
        data.accidentInfo,
      );
    }

    if (data.insuranceInfo) {
      updateData.insuranceInfo = this.mergeJsonField(
        existingDraft?.insuranceInfo as any,
        data.insuranceInfo,
      );
    }

    if (data.pricingPlan) {
      updateData.pricingPlan = this.mergeJsonField(
        existingDraft?.pricingPlan as any,
        data.pricingPlan,
      );
    }

    let claim;
    if (existingDraft) {
      // Update existing draft claim
      claim = await this.prisma.claim.update({
        where: { id: existingDraft.id },
        data: updateData,
      });
    } else {
      // Create new draft claim
      claim = await this.prisma.claim.create({
        data: {
          userId,
          status: ClaimStatus.INPROGRESS,
          ...updateData,
        },
      });
    }

    return this.mapToResponseDto(claim);
  }

  async clearProgress(userId: string): Promise<void> {
    try {
      // Delete the draft claim
      await this.prisma.claim.deleteMany({
        where: {
          userId,
          status: ClaimStatus.INPROGRESS,
        },
      });
    } catch (error) {
      // If no draft claim exists, that's fine - nothing to clear
      console.log('No draft claim to clear for user:', userId);
    }
  }

  async submitCalculator(userId: string): Promise<void> {
    const draftClaim = await this.prisma.claim.findFirst({
      where: {
        userId,
        status: ClaimStatus.INPROGRESS,
      },
    });

    if (!draftClaim) {
      throw new NotFoundException('No draft claim found for user');
    }

    // Update the draft claim to completed
    await this.prisma.claim.update({
      where: { id: draftClaim.id },
      data: {
        status: ClaimStatus.DV_CLAIM_CREATED,
        currentStep: 4, // Mark as completed
        lastAccessedAt: new Date(),
      },
    });
  }

  async getProgressStats(): Promise<any> {
    // Get stats for all claims
    const stepStats = await this.prisma.claim.groupBy({
      by: ['currentStep'],
      _count: {
        id: true,
      },
    });

    const totalClaims = await this.prisma.claim.count();
    const completedClaims = await this.prisma.claim.count({
      where: { status: ClaimStatus.DV_CLAIM_CREATED },
    });
    const draftClaims = await this.prisma.claim.count({
      where: { status: ClaimStatus.INPROGRESS },
    });

    // Get unique users who started the calculator
    const uniqueUsers = await this.prisma.claim.groupBy({
      by: ['userId'],
      _count: {
        userId: true,
      },
    });

    return {
      totalClaims,
      totalUniqueUsers: uniqueUsers.length,
      draftClaims,
      completedClaims,
      completionRate:
        totalClaims > 0 ? (completedClaims / totalClaims) * 100 : 0,
      stepDistribution: stepStats,
    };
  }

  // Helper method to get all user claims (useful for admin or user history)
  async getUserClaims(
    userId: string,
  ): Promise<CalculatorProgressResponseDto[]> {
    const claims = await this.prisma.claim.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    return claims.map((claim) => this.mapToResponseDto(claim));
  }

  private mergeJsonField(existingData: any, newData: any): any {
    if (!existingData) {
      return newData;
    }

    // Merge existing data with new data
    return {
      ...existingData,
      ...newData,
    };
  }

  private mapToResponseDto(claim: any): CalculatorProgressResponseDto {
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
      lastAccessedAt: claim.lastAccessedAt,
      vehicleInfo: {
        year: vehicleInfo.year || vehicleInfo.vehicleYear,
        make: vehicleInfo.make || vehicleInfo.vehicleMake,
        model: vehicleInfo.model || vehicleInfo.vehicleModel,
        vin: vehicleInfo.vin || vehicleInfo.vehicleVin,
        mileage: vehicleInfo.mileage || vehicleInfo.vehicleMileage,
        repairCost: vehicleInfo.repairCost,
        approximateCarPrice: vehicleInfo.approximateCarPrice,
      },
      accidentInfo: {
        accidentDate: accidentInfo.accidentDate,
        isAtFault: accidentInfo.isAtFault,
        isRepaired: accidentInfo.isRepaired,
        repairInvoiceFileName: accidentInfo.repairInvoiceFileName,
        repairInvoiceFileUrl: accidentInfo.repairInvoiceFileUrl,
        nextAction: accidentInfo.nextAction,
      },
      insuranceInfo: {
        yourInsurance: insuranceInfo.yourInsurance,
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
        state: claim.liabilityInfo?.state,
        accidentState: claim.liabilityInfo?.accidentState,
      },
      createdAt: claim.createdAt,
      updatedAt: claim.updatedAt,
    };
  }
}
