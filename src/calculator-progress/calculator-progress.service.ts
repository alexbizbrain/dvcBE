import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SaveProgressDto } from './dto/save-progress.dto';
import { CalculatorProgressResponseDto } from './dto/calculator-progress-response.dto';

@Injectable()
export class CalculatorProgressService {
  constructor(private readonly prisma: PrismaService) {}

  async getProgress(userId: string): Promise<CalculatorProgressResponseDto | null> {
    const progress = await this.prisma.calculatorProgress.findUnique({
      where: { userId },
    });

    if (!progress) {
      return null;
    }

    return this.mapToResponseDto(progress);
  }

  async saveProgress(
    userId: string,
    data: SaveProgressDto,
  ): Promise<CalculatorProgressResponseDto> {
    // Update lastAccessedAt on every save
    const updateData: any = {
      lastAccessedAt: new Date(),
    };

    // Add step tracking
    if (data.currentStep !== undefined) {
      updateData.currentStep = data.currentStep;
    }

    if (data.isSubmitted !== undefined) {
      updateData.isSubmitted = data.isSubmitted;
    }

    // Vehicle Info fields
    if (data.vehicleInfo) {
      if (data.vehicleInfo.year !== undefined) updateData.vehicleYear = data.vehicleInfo.year;
      if (data.vehicleInfo.make !== undefined) updateData.vehicleMake = data.vehicleInfo.make;
      if (data.vehicleInfo.model !== undefined) updateData.vehicleModel = data.vehicleInfo.model;
      if (data.vehicleInfo.vin !== undefined) updateData.vehicleVin = data.vehicleInfo.vin;
      if (data.vehicleInfo.mileage !== undefined) updateData.vehicleMileage = data.vehicleInfo.mileage;
    }

    // Accident Info fields
    if (data.accidentInfo) {
      if (data.accidentInfo.accidentDate !== undefined) updateData.accidentDate = data.accidentInfo.accidentDate;
      if (data.accidentInfo.isAtFault !== undefined) updateData.isAtFault = data.accidentInfo.isAtFault;
      if (data.accidentInfo.isRepaired !== undefined) updateData.isRepaired = data.accidentInfo.isRepaired;
      if (data.accidentInfo.repairCost !== undefined) updateData.repairCost = data.accidentInfo.repairCost;
      if (data.accidentInfo.approximateCarPrice !== undefined) updateData.approximateCarPrice = data.accidentInfo.approximateCarPrice;
      if (data.accidentInfo.nextAction !== undefined) updateData.nextAction = data.accidentInfo.nextAction;
    }

    // Insurance Info fields
    if (data.insuranceInfo) {
      if (data.insuranceInfo.yourInsurance !== undefined) updateData.yourInsurance = data.insuranceInfo.yourInsurance;
      if (data.insuranceInfo.claimNumber !== undefined) updateData.claimNumber = data.insuranceInfo.claimNumber;
      if (data.insuranceInfo.atFaultInsurance !== undefined) updateData.atFaultInsurance = data.insuranceInfo.atFaultInsurance;
      if (data.insuranceInfo.adjusterName !== undefined) updateData.adjusterName = data.insuranceInfo.adjusterName;
      if (data.insuranceInfo.adjusterEmail !== undefined) updateData.adjusterEmail = data.insuranceInfo.adjusterEmail;
      if (data.insuranceInfo.adjusterPhone !== undefined) updateData.adjusterPhone = data.insuranceInfo.adjusterPhone;
      if (data.insuranceInfo.adjusterCountryCode !== undefined) updateData.adjusterCountryCode = data.insuranceInfo.adjusterCountryCode;
      if (data.insuranceInfo.driverName !== undefined) updateData.driverName = data.insuranceInfo.driverName;
      if (data.insuranceInfo.driverEmail !== undefined) updateData.driverEmail = data.insuranceInfo.driverEmail;
      if (data.insuranceInfo.driverPhone !== undefined) updateData.driverPhone = data.insuranceInfo.driverPhone;
      if (data.insuranceInfo.driverCountryCode !== undefined) updateData.driverCountryCode = data.insuranceInfo.driverCountryCode;
    }

    // Pricing Plan fields
    if (data.pricingPlan) {
      if (data.pricingPlan.selectedPlan !== undefined) updateData.selectedPlan = data.pricingPlan.selectedPlan;
      if (data.pricingPlan.agreedToTerms !== undefined) updateData.agreedToTerms = data.pricingPlan.agreedToTerms;
      if (data.pricingPlan.signatureDataUrl !== undefined) updateData.signatureDataUrl = data.pricingPlan.signatureDataUrl;
    }

    const progress = await this.prisma.calculatorProgress.upsert({
      where: { userId },
      update: updateData,
      create: {
        userId,
        ...updateData,
      },
    });

    return this.mapToResponseDto(progress);
  }

  async clearProgress(userId: string): Promise<void> {
    try {
      await this.prisma.calculatorProgress.delete({
        where: { userId },
      });
    } catch (error) {
      // If record doesn't exist, that's fine - nothing to clear
      if (error.code !== 'P2025') {
        throw error;
      }
    }
  }

  async submitCalculator(userId: string): Promise<void> {
    const progress = await this.prisma.calculatorProgress.findUnique({
      where: { userId },
    });

    if (!progress) {
      throw new NotFoundException('No calculator progress found for user');
    }

    await this.prisma.calculatorProgress.update({
      where: { userId },
      data: {
        isSubmitted: true,
        currentStep: 4, // Mark as completed
        lastAccessedAt: new Date(),
      },
    });
  }

  async getProgressStats(): Promise<any> {
    // For admin analytics - get completion rates by step
    const stats = await this.prisma.calculatorProgress.groupBy({
      by: ['currentStep'],
      _count: {
        id: true,
      },
    });

    const totalUsers = await this.prisma.calculatorProgress.count();
    const submittedCount = await this.prisma.calculatorProgress.count({
      where: { isSubmitted: true },
    });

    return {
      totalStarted: totalUsers,
      totalSubmitted: submittedCount,
      completionRate: totalUsers > 0 ? (submittedCount / totalUsers) * 100 : 0,
      stepDistribution: stats,
    };
  }

  private mapToResponseDto(progress: any): CalculatorProgressResponseDto {
    return {
      id: progress.id,
      currentStep: progress.currentStep,
      isSubmitted: progress.isSubmitted,
      lastAccessedAt: progress.lastAccessedAt,
      vehicleInfo: {
        year: progress.vehicleYear,
        make: progress.vehicleMake,
        model: progress.vehicleModel,
        vin: progress.vehicleVin,
        mileage: progress.vehicleMileage,
      },
      accidentInfo: {
        accidentDate: progress.accidentDate,
        isAtFault: progress.isAtFault,
        isRepaired: progress.isRepaired,
        repairCost: progress.repairCost,
        approximateCarPrice: progress.approximateCarPrice,
        nextAction: progress.nextAction,
      },
      insuranceInfo: {
        yourInsurance: progress.yourInsurance,
        claimNumber: progress.claimNumber,
        atFaultInsurance: progress.atFaultInsurance,
        adjusterName: progress.adjusterName,
        adjusterEmail: progress.adjusterEmail,
        adjusterPhone: progress.adjusterPhone,
        adjusterCountryCode: progress.adjusterCountryCode,
        driverName: progress.driverName,
        driverEmail: progress.driverEmail,
        driverPhone: progress.driverPhone,
        driverCountryCode: progress.driverCountryCode,
      },
      pricingPlan: {
        selectedPlan: progress.selectedPlan,
        agreedToTerms: progress.agreedToTerms,
        signatureDataUrl: progress.signatureDataUrl,
      },
      createdAt: progress.createdAt,
      updatedAt: progress.updatedAt,
    };
  }
}