import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { ClaimsQueryDto } from './dto/claims-query.dto';
import { CalculatorProgressService } from 'src/calculator-progress/calculator-progress.service';

type UiStatus = 'IN_PROGRESS' | 'COMPLETED';

const toUiStatus = (row: any): UiStatus => {
  // If your LiabilityClaim has `status` enum, prefer that.
  // Otherwise map via `isClosed` boolean if present.
  if (row?.status === 'COMPLETED' || row?.isClosed === true) return 'COMPLETED';
  return 'IN_PROGRESS';
};

const titleFrom = (o: {
  vehicleMake?: string | null;
  vehicleModel?: string | null;
  vehicleVin?: string | null;
}): string => {
  const base = `${o.vehicleMake ?? 'Vehicle'} ${o.vehicleModel ?? ''}`.trim();
  // If you have a plate code instead, replace vin with that field
  const right = o.vehicleVin ? ` - ${o.vehicleVin}` : '';
  return `${base}${right}`.trim();
};

const dmy = (d?: Date | null | string): string => {
  if (!d) return '';
  if (typeof d === 'string') return d; // your CalculatorProgress.accidentDate is a string
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

// const parseMoneyFromString = (val?: string | null) => {
//   if (!val) return 0;
//   const n = Number(String(val).replace(/[^\d.]/g, ''));
//   return Number.isFinite(n) ? n : 0;
// };

@Injectable()
export class UserDashboardService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly _calculatorProgressService: CalculatorProgressService,
  ) {}

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

  async getActiveClaim(userId: string) {
    const claim = await this.prismaService.liabilityClaim.findFirst({
      where: {
        userId,
        // OR: [
        //   { isClosed: false },
        //   { status: 'IN_PROGRESS' as any },
        //   { status: null },
        // ],
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (claim) {
      return {
        id: claim.id,
        title: titleFrom({
          vehicleMake: 'Honda', // claim.vehicleMake,
          vehicleModel: 'Civic', // claim.vehicleModel,
          vehicleVin: 'FY-2914', // claim.vehicleVin,
        }),
        status: toUiStatus(claim),
        details: {
          vehicleYear: '2000', // claim.vehicleYear ?? '',
          make: 'Honda', // `${claim.vehicleMake ?? ''} ${claim.vehicleModel ?? ''}`.trim(),
          model: 'Civic', // claim.vehicleVin ?? '',
          currentMileage: '10000 km', // claim.vehicleMileage
          // ? `${claim.vehicleMileage} km`
          // : '',
          dateOfAccident: '2020-08-12', // dmy(claim.accidentDate ?? null), // Date or null depending on your schema
          insuranceProvider: 'EFU Insurance', // claim.yourInsurance ?? claim.atFaultInsurance ?? '',
          claimNumber: '12954640747', // claim.claimNumber ?? '',
          adjusterName: 'John David', // claim.adjusterName ?? '',
        },
      };
    }

    const draft = await this.prismaService.calculatorProgress.findUnique({
      where: { userId },
    });
    if (!draft) return null;

    return {
      id: 'draft',
      title: titleFrom({
        vehicleMake: draft.vehicleMake,
        vehicleModel: draft.vehicleModel,
        vehicleVin: draft.vehicleVin,
      }),
      status: 'IN_PROGRESS' as UiStatus,
      details: {
        vehicleYear: draft.vehicleYear ?? '',
        make: `${draft.vehicleMake ?? ''} ${draft.vehicleModel ?? ''}`.trim(),
        model: draft.vehicleVin ?? '',
        currentMileage: draft.vehicleMileage
          ? `${draft.vehicleMileage} km`
          : '',
        dateOfAccident: draft.accidentDate ?? '',
        insuranceProvider: draft.yourInsurance ?? draft.atFaultInsurance ?? '',
        claimNumber: draft.claimNumber ?? '',
        adjusterName: draft.adjusterName ?? '',
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
      items: rows.map((c) => ({
        id: c.id,
        title: titleFrom({
          vehicleMake: 'Honda', // c.vehicleMake,
          vehicleModel: 'Civic', // c.vehicleModel,
          vehicleVin: 'FY-2914', // c.vehicleVin,
        }),
        status: toUiStatus(c),
        createdAt: '2020-08-12', // dmy(c.createdAt as any), // Date
        details: {
          vehicleYear: '2000', // c.vehicleYear ?? '',
          make: 'Honda', // `${c.vehicleMake ?? ''} ${c.vehicleModel ?? ''}`.trim(),
          model: 'Civic', // c.vehicleVin ?? '',
          currentMileage: '10000 km', // c.vehicleMileage ? `${c.vehicleMileage} km` : '',
          dateOfAccident: '2020-08-12', // dmy((c as any).accidentDate ?? null),
          insuranceProvider: 'EFU Insurance', // c.yourInsurance ?? c.atFaultInsurance ?? '',
          claimNumber: '12954640747', // c.claimNumber ?? '',
          adjusterName: 'John David', // c.adjusterName ?? '',
        },
      })),
    };
  }

  async getLatestDocuments(userId: string, limit = 2) {
    // If you later add a ClaimDocument model, prefer it here.
    // For now, use the calculator invoice as "document".
    const draft = await this.prismaService.calculatorProgress.findUnique({
      where: { userId },
    });
    if (draft?.repairInvoiceFileUrl) {
      return {
        items: [
          {
            id: draft.id,
            title: titleFrom(draft as any),
            date: dmy(draft.updatedAt),
            previewUrl: draft.repairInvoiceFileUrl,
            fileUrl: draft.repairInvoiceFileUrl,
          },
        ].slice(0, limit),
      };
    }
    return { items: [] };
  }
}
