import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CalculatorProgressService } from 'src/calculator-progress/calculator-progress.service';
import { GetClaimsQueryDto } from './dto/claims-query.dto';
import { ClaimStatus, Prisma } from '@prisma/client';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';
import { DocumentDto } from './dto/document.dto';
import { UserClaimViewDto } from './dto/user-claim-view.dto';

@Injectable()
export class UserDashboardService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly _calculatorProgressService: CalculatorProgressService,
  ) { }

  async listForUser(userId: string, q: GetClaimsQueryDto) {
    const { status, sortBy, sortOrder, page = 1, limit = 10 } = q;

    const where: Prisma.ClaimWhereInput = {
      userId,
      ...(status?.length ? { status: { in: status } } : {}),
    };

    const orderBy: Prisma.ClaimOrderByWithRelationInput =
      sortBy && sortOrder
        ? {
          [sortBy]: sortOrder,
        }
        : { createdAt: 'desc' };

    const skip = (page - 1) * limit;
    const take = limit;

    const [items, total] = await this.prismaService.$transaction([
      this.prismaService.claim.findMany({
        where,
        orderBy,
        skip,
        take,
      }),
      this.prismaService.claim.count({ where }),
    ]);

    return {
      data: items,
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        sortBy,
        sortOrder,
        hasNext: page * limit < total,
        hasPrev: page > 1,
        filters: {
          status: status ?? null,
        },
      },
      success: true,
    };
  }

  async getStats(userId: string): Promise<DashboardStatsDto> {
    const totalClaims = await this.prismaService.claim.count({
      where: {
        userId,
      },
    });

    const ACTIVE_STATUSES: ClaimStatus[] = [
      ClaimStatus.INPROGRESS,
      ClaimStatus.DV_CLAIM_CREATED,
      ClaimStatus.SUBMITTED_TO_INSURER,
      ClaimStatus.NEGOTIATION,
      ClaimStatus.FINAL_OFFER_MADE,
    ];

    const activeClaims = await this.prismaService.claim.count({
      where: {
        userId,
        status: { in: ACTIVE_STATUSES },
      },
    });

    const claims = await this.prismaService.claim.findMany({
      where: { userId },
      select: {
        pricingPlan: true,
        vehicleInfo: true,
      },
    });

    const toNumber = (v: unknown): number => {
      if (v === null) return 0;
      if (typeof v === 'number') return v;
      if (typeof v === 'string') {
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
      }
      return 0;
    };

    const totalEstimatedAmount = claims.reduce((sum, c) => {
      const pp: any = c.pricingPlan ?? {};
      const vi: any = c.vehicleInfo ?? {};
      const amount =
        toNumber(pp.estimatedAmount) ||
        toNumber(pp.dvEstimate) ||
        toNumber(vi.repairCost);
      return sum + amount;
    }, 0);

    return {
      totalClaims,
      activeClaims,
      totalEstimatedAmount,
    };
  }

  async getActiveClaim(userId: string) {
    const ACTIVE_STATUSES: ClaimStatus[] = [
      ClaimStatus.INPROGRESS,
      ClaimStatus.DV_CLAIM_CREATED,
      ClaimStatus.SUBMITTED_TO_INSURER,
      ClaimStatus.NEGOTIATION,
      ClaimStatus.FINAL_OFFER_MADE,
    ];

    const claim = await this.prismaService.claim.findFirst({
      where: {
        userId,
        status: { in: ACTIVE_STATUSES },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return claim ?? null;
  }

  async getLatestDocuments(userId: string, limit = 3) {
    const { data } = await this.listDocumnets(userId, 1, limit);
    return data;
  }

  async listDocumnets(userId: string, page = 1, limit = 10) {
    const claims = await this.prismaService.claim.findMany({
      where: {
        userId,
      },
      select: {
        id: true,
        updatedAt: true,
        status: true,
        accidentInfo: true,
        insuranceInfo: true,
        pricingPlan: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    const docs: DocumentDto[] = claims.flatMap((c) =>
      this.extractDocumentsFromClaim(c.id, c.status, c.updatedAt, c),
    );

    docs.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());

    const total = docs.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    const slice = docs.slice(start, end);

    return {
      data: slice,
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async getClaimById(
    userId: string,
    claimId: string,
  ): Promise<UserClaimViewDto> {
    const claim = await this.prismaService.claim.findFirst({
      where: { id: claimId, userId },
    });
    if (!claim) throw new NotFoundException('Claim not found');

    return this.mapToUserView(claim);
  }

  private extractDocumentsFromClaim(
    claimId: string,
    status: ClaimStatus,
    ts: Date,
    c: {
      accidentInfo: Prisma.JsonValue | null;
      insuranceInfo: Prisma.JsonValue | null;
      pricingPlan: Prisma.JsonValue | null;
    },
  ): DocumentDto[] {
    const docs: DocumentDto[] = [];
    const pushIf = (type: string, fileName?: unknown, fileUrl?: unknown) => {
      const fName = this.toStringOrNull(fileName);
      const fUrl = this.toStringOrNull(fileUrl);
      if (fName && fUrl) {
        docs.push({
          claimId,
          type,
          fileName: fName,
          fileUrl: fUrl,
          uploadedAt: ts,
          claimStatus: status,
        });
      }
    };

    const ai: any = c.accidentInfo ?? {};
    const ii: any = c.insuranceInfo ?? {};
    const pp: any = c.pricingPlan ?? {};

    pushIf('repairInvoice', ai.repairInvoiceFileName, ai.repairInvoiceFileUrl);

    pushIf(
      'autoInsuranceCard',
      ii.autoInsuranceCardFileName,
      ii.autoInsuranceCardFileUrl,
    );
    pushIf(
      'driverLicenseFront',
      ii.driverLicenseFrontFileName,
      ii.driverLicenseFrontFileUrl,
    );
    pushIf(
      'driverLicenseBack',
      ii.driverLicenseBackFileName,
      ii.driverLicenseBackFileUrl,
    );

    if (
      typeof pp.signatureDataUrl === 'string' &&
      pp.signatureDataUrl.startsWith('http')
    ) {
      pushIf('signature', null, pp.signatureDataUrl);
    }

    return docs;
  }

  private toStringOrNull(v: unknown): string | null {
    if (typeof v === 'string' && v.trim()) return v;
    return null;
  }

  private mapToUserView(claim: any): UserClaimViewDto {
    const vi = claim.vehicleInfo ?? {};
    const ai = claim.accidentInfo ?? {};
    const ii = claim.insuranceInfo ?? {};
    const pp = claim.pricingPlan ?? {};
    const li = claim.liabilityInfo ?? {};

    const toNumber = (v: unknown): number | null => {
      if (v == null) return null;
      if (typeof v === 'number') return Number.isFinite(v) ? v : null;
      if (typeof v === 'string') {
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
      }
      return null;
    };

    const estimatedAmount =
      toNumber(pp.estimatedAmount) ??
      toNumber(pp.dvEstimate) ??
      toNumber(vi.repairCost) ??
      null;

    const documents = this.extractDocumentsFromClaim(
      claim.id,
      claim.status,
      claim.updatedAt,
      {
        accidentInfo: claim.accidentInfo,
        insuranceInfo: claim.insuranceInfo,
        pricingPlan: claim.pricingPlan,
      },
    );

    return {
      id: claim.id,
      currentStep: claim.currentStep,
      status: claim.status,
      flow: claim.flow,
      lastAccessedAt: claim.lastAccessedAt,
      createdAt: claim.createdAt,
      updatedAt: claim.updatedAt,
      vehicleInfo: {
        year: vi.year ?? vi.vehicleYear,
        make: vi.make ?? vi.vehicleMake,
        model: vi.model ?? vi.vehicleModel,
        vin: vi.vin ?? vi.vehicleVin,
        mileage: vi.mileage ?? vi.vehicleMileage,
        repairCost: toNumber(vi.repairCost),
        approximateCarPrice: vi.approximateCarPrice,
      },
      accidentInfo: {
        accidentDate: ai.accidentDate,
        isAtFault: ai.isAtFault,
        isRepaired: ai.isRepaired,
        repairInvoiceFileName: ai.repairInvoiceFileName,
        repairInvoiceFileUrl: ai.repairInvoiceFileUrl,
        nextAction: ai.nextAction,
        hitAndRun: ai.hitAndRun,
      },
      insuranceInfo: {
        yourInsurance: ii.yourInsurance,
        claimNumber: ii.claimNumber,
        atFaultInsurance: ii.atFaultInsurance,
        adjusterName: ii.adjusterName,
        adjusterEmail: ii.adjusterEmail,
        adjusterPhone: ii.adjusterPhone,
        adjusterCountryCode: ii.adjusterCountryCode,
        driverName: ii.driverName,
        driverEmail: ii.driverEmail,
        driverPhone: ii.driverPhone,
        driverCountryCode: ii.driverCountryCode,
        autoInsuranceCardFileName: ii.autoInsuranceCardFileName,
        autoInsuranceCardFileUrl: ii.autoInsuranceCardFileUrl,
        driverLicenseFrontFileName: ii.driverLicenseFrontFileName,
        driverLicenseFrontFileUrl: ii.driverLicenseFrontFileUrl,
        driverLicenseBackFileName: ii.driverLicenseBackFileName,
        driverLicenseBackFileUrl: ii.driverLicenseBackFileUrl,
      },
      pricingPlan: {
        selectedPlan: pp.selectedPlan,
        agreedToTerms: !!pp.agreedToTerms,
        // Allow hosted URLs (http/https) and inline data URLs (data:image)
        signatureDataUrl:
          typeof pp.signatureDataUrl === 'string' &&
            (pp.signatureDataUrl.startsWith('http') ||
              pp.signatureDataUrl.startsWith('data:'))
            ? pp.signatureDataUrl
            : null,
        estimatedAmount,
      },
      liabilityInfo: {
        isAtFault: li.isAtFault ?? ai.isAtFault,
        state: li.state,
        accidentState: li.accidentState,
      },
      documents,
    };
  }
}
