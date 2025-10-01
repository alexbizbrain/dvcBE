import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SaveProgressDto } from './dto/save-progress.dto';
import { CalculatorProgressResponseDto } from './dto/calculator-progress-response.dto';
import { ClaimStatus, ClaimFlow } from '@prisma/client';

@Injectable()
export class CalculatorProgressService {
  constructor(private readonly prisma: PrismaService) { }

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

    // Update flow if provided
    if (data.flow !== undefined) {
      updateData.flow = data.flow;
    }
    if (
      data.currentStep === 2 &&
      typeof existingDraft?.liabilityInfo === 'object' &&
      existingDraft?.liabilityInfo !== null &&
      (existingDraft.liabilityInfo as any).isAtFault
    ) {
      updateData.status = ClaimStatus.DISQUALIFIED;
    }

    // Disqualify claims from New York and North Carolina
    if (
      data.currentStep === 2 &&
      typeof existingDraft?.liabilityInfo === 'object' &&
      existingDraft?.liabilityInfo !== null &&
      ((existingDraft.liabilityInfo as any).accidentState === 'New York' ||
        (existingDraft.liabilityInfo as any).accidentState === 'North Carolina')
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

    // Check if hasRepairEstimate is false and set status to REPAIR_COST_PENDING
    if (
      data.currentStep === 2 &&
      data.accidentInfo &&
      typeof data.accidentInfo === 'object' &&
      data.accidentInfo.hasRepairEstimate === false
    ) {
      updateData.status = ClaimStatus.REPAIR_COST_PENDING;
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
      // Handle custom insurance company creation on step 4
      let processedInsuranceInfo = data.insuranceInfo;
      if (data.currentStep === 4) {
        processedInsuranceInfo = await this.handleCustomInsuranceCompany(
          userId,
          data.insuranceInfo,
        );
      }

      updateData.insuranceInfo = this.mergeJsonField(
        existingDraft?.insuranceInfo as any,
        processedInsuranceInfo,
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
          flow: data.flow || ClaimFlow.CALCULATOR_FORM, // Use provided flow or default to CALCULATOR_FORM
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
    } catch {
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
        hitAndRun: accidentInfo.hitAndRun,
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

  private async handleCustomInsuranceCompany(
    userId: string,
    insuranceInfo: any,
  ): Promise<any> {
    const processedInsuranceInfo = { ...insuranceInfo };

    // Note: yourInsurance section has been removed per frontend changes
    // Only handle atFaultInsurance custom company creation

    // Handle atFaultInsurance custom company creation
    if (
      insuranceInfo?.atFaultInsurance &&
      !insuranceInfo.atFaultInsurance.insuranceCompanyId &&
      insuranceInfo.atFaultInsurance.companyName
    ) {
      const customInsuranceCompany = await this.prisma.insuranceCompany.create({
        data: {
          companyName: insuranceInfo.atFaultInsurance.companyName,
          contactEmail: '', // Default empty email
          insuranceType: 'AUTO', // Default to AUTO
          type: 'CUSTOM',
          userId: userId,
        },
      });

      processedInsuranceInfo.atFaultInsurance = {
        insuranceCompanyId: customInsuranceCompany.id,
        companyName: customInsuranceCompany.companyName,
      };
    }

    return processedInsuranceInfo;
  }
}
