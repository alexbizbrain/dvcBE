import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { ClaimsQueryDto } from './dto/claims-query.dto';
import { CalculatorProgressService } from 'src/calculator-progress/calculator-progress.service';

type UiStatus = 'IN_PROGRESS' | 'COMPLETED';

const toUiStatus = (row: any): UiStatus => {
  if (row?.status === 'COMPLETED' || row?.isClosed === true) return 'COMPLETED';
  return 'IN_PROGRESS';
};

const titleFrom = (o: {
  vehicleMake?: string | null;
  vehicleModel?: string | null;
  vehicleVin?: string | null;
}): string => {
  const base = `${o.vehicleMake ?? 'Vehicle'} ${o.vehicleModel ?? ''}`.trim();
  const right = o.vehicleVin ? ` - ${o.vehicleVin}` : '';
  return `${base}${right}`.trim();
};

const dmy = (d?: Date | null | string): string => {
  if (!d) return '';
  if (typeof d === 'string') return d;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

@Injectable()
export class UserDashboardService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly _calculatorProgressService: CalculatorProgressService,
  ) { }

  async getSummary(userId: string) {
    // const [activeClaims, totalClaims /* amount */] = await Promise.all([
    // this.prismaService.liabilityClaim.count({
    // where: { userId /* status: 'IN_PROGRESS' */ /* isClosed: false */ },
    // }),
    // this.prismaService.liabilityClaim.count({ where: { userId } }),
    // Adjust field name when confirmed (e.g., payoutAmount, settlementAmount, totalClaim):
    // this.prismaService.liabilityClaim.aggregate({
    //   where: { userId /* ensure only finalized amounts if needed */ },
    //   _sum: { payoutAmount: true as any } as any,
    // }),
    // ]);

    // const totalClaimAmount = (amount as any)?._sum?.payoutAmount ?? 0;

    return { activeClaims: 10, totalClaims: 20, totalClaimAmount: 500 };
  }

  /**
   * Helpers to safely extract JSON fields from the Claim row
   */
  private vehicleFrom(row: any) {
    const v = (row?.vehicleInfo) ?? {};
    // normalize names used in older code
    return {
      vehicleMake: v.make ?? v.vehicleMake ?? null,
      vehicleModel: v.model ?? v.vehicleModel ?? null,
      vehicleVin: v.vin ?? v.vehicleVin ?? null,
      vehicleYear: v.year ?? v.vehicleYear ?? null,
      vehicleMileage: v.mileage ?? v.vehicleMileage ?? null,
    };
  }

  private accidentFrom(row: any) {
    const a = (row?.accidentInfo) ?? {};
    return {
      accidentDate: a.date ?? a.accidentDate ?? null,
      // add any other accident fields you expect
    };
  }

  private insuranceFrom(row: any) {
    const ins = (row?.insuranceInfo) ?? {};
    return {
      yourInsurance: ins.yourInsurance ?? null,
      atFaultInsurance: ins.atFaultInsurance ?? null,
      claimNumber: ins.claimNumber ?? null,
      adjusterName: ins.adjusterName ?? null,
    };
  }

  private pricingFrom(row: any) {
    return (row?.pricingPlan) ?? {};
  }

  async getActiveClaim(userId: string) {
    // first try to find a finalized claim (latest)
    const claim = await this.prismaService.claim.findFirst({
      where: {
        userId,
        // add additional filters for 'active' if needed
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (claim) {
      // read from JSON fields if present, fallback to safe defaults
      const v = this.vehicleFrom(claim);
      const a = this.accidentFrom(claim);
      const ins = this.insuranceFrom(claim);

      return {
        id: claim.id,
        title: titleFrom({
          vehicleMake: v.vehicleMake ?? 'Vehicle',
          vehicleModel: v.vehicleModel ?? '',
          vehicleVin: v.vehicleVin ?? '',
        }),
        status: toUiStatus(claim),
        details: {
          vehicleYear: v.vehicleYear ?? '',
          make: `${v.vehicleMake ?? ''} ${v.vehicleModel ?? ''}`.trim(),
          model: v.vehicleVin ?? '',
          currentMileage: v.vehicleMileage ? `${v.vehicleMileage} km` : '',
          dateOfAccident: a.accidentDate ? dmy(a.accidentDate as any) : '',
          insuranceProvider: ins.yourInsurance ?? ins.atFaultInsurance ?? '',
          claimNumber: ins.claimNumber ?? '',
          adjusterName: ins.adjusterName ?? '',
        },
      };
    }

    // if no finalized claim, look for a draft (also findFirst by userId)
    const draft = await this.prismaService.claim.findFirst({
      where: { userId },
    });
    if (!draft) return null;

    const dv = this.vehicleFrom(draft);
    const da = this.accidentFrom(draft);
    const di = this.insuranceFrom(draft);

    return {
      id: 'draft',
      title: titleFrom({
        vehicleMake: dv.vehicleMake,
        vehicleModel: dv.vehicleModel,
        vehicleVin: dv.vehicleVin,
      }),
      status: 'IN_PROGRESS' as UiStatus,
      details: {
        vehicleYear: dv.vehicleYear ?? '',
        make: `${dv.vehicleMake ?? ''} ${dv.vehicleModel ?? ''}`.trim(),
        model: dv.vehicleVin ?? '',
        currentMileage: dv.vehicleMileage ? `${dv.vehicleMileage} km` : '',
        dateOfAccident: da.accidentDate ?? '',
        insuranceProvider: di.yourInsurance ?? di.atFaultInsurance ?? '',
        claimNumber: di.claimNumber ?? '',
        adjusterName: di.adjusterName ?? '',
      },
    };
  }

  async listClaims(userId: string, q: ClaimsQueryDto) {
    const { page, pageSize /* status */ } = q;

    const where: Prisma.LiabilityClaimWhereInput = { userId };
    // if (status) where.status = status;

    const [totalItems, rows] = await Promise.all([
      this.prismaService.liabilityClaim.count({ where }),
      this.prismaService.liabilityClaim.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    return {
      page,
      pageSize,
      totalPages,
      totalItems,
      items: rows.map((c) => {
        // If liabilityClaim has JSON vehicle fields, extract similarly. For now use placeholders
        // (you can replace with actual extraction like in getActiveClaim if schema matches)
        return {
          id: c.id,
          title: titleFrom({
            vehicleMake: 'Honda', // replace with actual parsed value if available
            vehicleModel: 'Civic',
            vehicleVin: 'FY-2914',
          }),
          status: toUiStatus(c),
          createdAt: dmy(c.createdAt as any),
          details: {
            vehicleYear: '2000',
            make: 'Honda',
            model: 'Civic',
            currentMileage: '10000 km',
            dateOfAccident: '2020-08-12',
            insuranceProvider: 'EFU Insurance',
            claimNumber: '12954640747',
            adjusterName: 'John David',
          },
        };
      }),
    };
  }

  async getLatestDocuments(userId: string, limit = 2) {
    // Use findFirst by userId (userId not unique)
    const draft = await this.prismaService.claim.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    // try to read repairInvoiceFileUrl from pricingPlan JSON (or wherever you store it)
    const pricing = this.pricingFrom(draft as any);
    const invoiceUrl =
      pricing?.repairInvoiceFileUrl ??
      (draft as any)?.repairInvoiceFileUrl ??
      null;

    if (invoiceUrl) {
      return {
        items: [
          {
            id: draft?.id ?? 'draft',
            title: titleFrom(this.vehicleFrom(draft as any)),
            date: dmy(draft?.updatedAt as any),
            previewUrl: invoiceUrl,
            fileUrl: invoiceUrl,
          },
        ].slice(0, limit),
      };
    }

    return { items: [] };
  }
}
