import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ClaimStatus, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { AdminClaimsQueryDto } from './dto/admin-claims-query.dto';
import { AdminDocumentDto } from './dto/document.dto';
import { MergeClaimJsonDto } from './dto/merge-claim-json.dto';
import { AdminStatsDto } from './dto/admin-stats.dto';
import { PatchVehicleInfoDto } from './dto/patch-vehicle-info.dto';
import { PatchAccidentInfoDto } from './dto/patch-accident-info.dto';
import { PatchInsuranceInfoDto } from './dto/patch-insurance-info.dto';
import { PatchLiabilityInfoDto } from './dto/patch-liability-info.dto';
import { NotificationsService } from 'src/notifications/notification.service';

const ACTIVE_STATUSES: ClaimStatus[] = [
  ClaimStatus.INPROGRESS,
  ClaimStatus.REPAIR_COST_PENDING,
  ClaimStatus.DV_CLAIM_CREATED,
  ClaimStatus.SUBMITTED_TO_INSURER,
  ClaimStatus.NEGOTIATION,
  ClaimStatus.FINAL_OFFER_MADE,
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const TERMINAL_STATUSES: ClaimStatus[] = [
  ClaimStatus.DISQUALIFIED,
  ClaimStatus.CLAIM_SETTLED,
  ClaimStatus.CLAIM_PAID,
  ClaimStatus.CLOSED,
];

const ALLOWED_TRANSITIONS: Partial<Record<ClaimStatus, ClaimStatus[]>> = {
  DISQUALIFIED: [ClaimStatus.CLOSED],
  INPROGRESS: [
    ClaimStatus.REPAIR_COST_PENDING,
    ClaimStatus.DV_CLAIM_CREATED,
    ClaimStatus.DISQUALIFIED,
    ClaimStatus.CLOSED,
  ],
  DV_CLAIM_CREATED: [ClaimStatus.SUBMITTED_TO_INSURER, ClaimStatus.CLOSED],
  SUBMITTED_TO_INSURER: [ClaimStatus.NEGOTIATION, ClaimStatus.CLOSED],
  NEGOTIATION: [ClaimStatus.FINAL_OFFER_MADE, ClaimStatus.CLOSED],
  FINAL_OFFER_MADE: [ClaimStatus.CLAIM_SETTLED, ClaimStatus.CLOSED],
  CLAIM_SETTLED: [ClaimStatus.CLAIM_PAID, ClaimStatus.CLOSED],
  CLAIM_PAID: [ClaimStatus.CLOSED],
  CLOSED: [],
  REPAIR_COST_PENDING: [
    ClaimStatus.DV_CLAIM_CREATED,
    ClaimStatus.DISQUALIFIED,
    ClaimStatus.CLOSED,
  ],
};

@Injectable()
export class ClaimsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async list(q: AdminClaimsQueryDto) {
    const {
      status,
      steps,
      userEmail,
      userPhone,
      userName,
      vin,
      insurer,
      isAtFault,
      hitAndRun,
      hasDocuments,
      search,
      sortBy = 'updatedAt',
      sortOrder = 'desc',
      createdFrom,
      createdTo,
      updatedFrom,
      updatedTo,
      page = 1,
      limit = 10,
      userId,
    } = q;

    const where: Prisma.ClaimWhereInput = {
      // Use provided status filter; otherwise default to excluding DISQUALIFIED
      ...(status?.length
        ? { status: { in: status } }
        : { status: { not: ClaimStatus.DISQUALIFIED } }),
      ...(steps?.length ? { currentStep: { in: steps } } : {}),
      ...(createdFrom || createdTo
        ? {
            createdAt: {
              gte: createdFrom ? new Date(createdFrom) : undefined,
              lte: createdTo ? new Date(createdTo) : undefined,
            },
          }
        : {}),
      ...(updatedFrom || updatedTo
        ? {
            updatedAt: {
              gte: updatedFrom ? new Date(updatedFrom) : undefined,
              lte: updatedTo ? new Date(updatedTo) : undefined,
            },
          }
        : {}),
      // JSON-based filters using Prisma JSON path operators
      ...(vin
        ? {
            vehicleInfo: {
              path: ['vin'],
              string_contains: vin,
              mode: 'insensitive',
            } as any,
          }
        : {}),
      ...(insurer
        ? {
            OR: [
              {
                insuranceInfo: {
                  path: ['atFaultInsurance', 'companyName'],
                  string_contains: insurer,
                  mode: 'insensitive',
                } as any,
              },
            ],
          }
        : {}),
      ...(typeof isAtFault === 'boolean'
        ? {
            OR: [
              {
                liabilityInfo: {
                  path: ['isAtFault'],
                  equals: isAtFault,
                } as any,
              },
              {
                accidentInfo: { path: ['isAtFault'], equals: isAtFault } as any,
              },
            ],
          }
        : {}),
      ...(typeof hitAndRun === 'boolean'
        ? { accidentInfo: { path: ['hitAndRun'], equals: hitAndRun } as any }
        : {}),
      ...(search
        ? {
            OR: [
              {
                insuranceInfo: {
                  path: ['claimNumber'],
                  string_contains: search,
                  mode: 'insensitive',
                } as any,
              },
              {
                insuranceInfo: {
                  path: ['adjusterName'],
                  string_contains: search,
                  mode: 'insensitive',
                } as any,
              },
              {
                insuranceInfo: {
                  path: ['driverName'],
                  string_contains: search,
                  mode: 'insensitive',
                } as any,
              },
              {
                vehicleInfo: {
                  path: ['make'],
                  string_contains: search,
                  mode: 'insensitive',
                } as any,
              },
              {
                vehicleInfo: {
                  path: ['model'],
                  string_contains: search,
                  mode: 'insensitive',
                } as any,
              },
              {
                vehicleInfo: {
                  path: ['vin'],
                  string_contains: search,
                  mode: 'insensitive',
                } as any,
              },
            ],
          }
        : {}),
      ...(hasDocuments
        ? {
            OR: [
              {
                accidentInfo: {
                  path: ['repairInvoiceFileUrl'],
                  not: Prisma.DbNull,
                } as any,
              },
              {
                insuranceInfo: {
                  path: ['autoInsuranceCardFileUrl'],
                  not: Prisma.DbNull,
                } as any,
              },
              {
                insuranceInfo: {
                  path: ['driverLicenseFrontFileUrl'],
                  not: Prisma.DbNull,
                } as any,
              },
              {
                insuranceInfo: {
                  path: ['driverLicenseBackFileUrl'],
                  not: Prisma.DbNull,
                } as any,
              },
            ],
          }
        : {}),
      user: {
        ...(userEmail
          ? { email: { contains: userEmail, mode: 'insensitive' } }
          : {}),
        ...(userPhone ? { phoneNumber: { contains: userPhone } } : {}),
        ...(userName
          ? {
              OR: [
                { firstName: { contains: userName, mode: 'insensitive' } },
                { lastName: { contains: userName, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      ...(userId ? { userId: { equals: userId } } : {}),
    };

    const orderBy: Prisma.ClaimOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const skip = (page - 1) * limit;
    const take = limit;

    const [items, total] = await this.prismaService.$transaction([
      this.prismaService.claim.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              phoneNumber: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      this.prismaService.claim.count({
        where,
      }),
    ]);

    return {
      success: true,
      data: items,
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        sortBy,
        sortOrder,
        filters: { status: status ?? null, steps: steps ?? null },
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async getOne(id: string) {
    const claim = await this.prismaService.claim.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phoneNumber: true,
            firstName: true,
            lastName: true,
            isBusinessUser: true,
          },
        },
      },
    });
    if (!claim) throw new NotFoundException('Claim not found');

    const vi: any = claim.vehicleInfo ?? {};
    const ai: any = claim.accidentInfo ?? {};
    const ii: any = claim.insuranceInfo ?? {};
    const pp: any = claim.pricingPlan ?? {};
    const li: any = claim.liabilityInfo ?? {};

    const estimatedAmount =
      this.num(pp.estimatedAmount) ||
      this.num(pp.dvEstimate) ||
      this.num(vi.repairCost) ||
      0;

    return {
      ...claim,
      normalized: {
        vehicle: {
          year: vi.year ?? vi.vehicleYear,
          make: vi.make ?? vi.vehicleMake,
          model: vi.model ?? vi.vehicleModel,
          vin: vi.vin ?? vi.vehicleVin,
          mileage: vi.mileage ?? vi.vehicleMileage,
          repairCost: this.num(vi.repairCost) || null,
        },
        accident: {
          date: ai.accidentDate ?? null,
          isAtFault: ai.isAtFault ?? li.isAtFault ?? null,
          isRepaired: ai.isRepaired ?? null,
          hitAndRun: ai.hitAndRun ?? null,
          nextAction: ai.nextAction ?? null,
        },
        insurance: {
          atFaultInsurance: ii.atFaultInsurance ?? null,
          claimNumber: ii.claimNumber ?? null,
          adjusterName: ii.adjusterName ?? null,
          adjusterEmail: ii.adjusterEmail ?? null,
          adjusterPhone: ii.adjusterPhone ?? null,
          driverName: ii.driverName ?? null,
          driverEmail: ii.driverEmail ?? null,
          driverPhone: ii.driverPhone ?? null,
        },
        pricing: {
          plan: pp.selectedPlan ?? null,
          agreedToTerms: !!pp.agreedToTerms,
          signatureUrl:
            typeof pp.signatureDataUrl === 'string' &&
            pp.signatureDataUrl.startsWith('http')
              ? pp.signatureDataUrl
              : null,
          estimatedAmount,
        },
        liability: {
          isAtFault: li.isAtFault ?? ai.isAtFault ?? null,
          state: li.state ?? null,
          accidentState: li.accidentState ?? null,
        },
        documents: this.extractDocumentsFromClaim(
          claim.id,
          claim.userId,
          claim.status,
          claim.updatedAt,
          { accidentInfo: ai, insuranceInfo: ii, pricingPlan: pp },
        ),
      },
    };
  }

  async updateStatus(id: string, to: ClaimStatus, adminId: string) {
    const claim = await this.prismaService.claim.findUnique({ where: { id } });
    if (!claim) throw new NotFoundException('Claim not found');

    const from = claim.status;
    if (!ALLOWED_TRANSITIONS[from]?.includes(to)) {
      throw new BadRequestException(`Illegal transition: ${from} ➜ ${to}`);
    }

    const updated = await this.prismaService.claim.update({
      where: { id },
      data: { status: to, updatedAt: new Date(), lastAccessedAt: new Date() },
    });

    try {
      await this.notificationsService.notifyClaimStatusChanged({
        userId: updated.userId,
        claimId: updated.id,
        newStatus: to,
        payload: {
          fromStatus: from,
          adminId,
          updatedAt: updated.updatedAt,
        },
        title: this.humanTitleFor(to),
        body: `Your claim ${updated.id} moved from ${from} to ${to}`,
      });
    } catch (error) {
      console.error(error);
    }

    return updated;
  }

  private humanTitleFor(s: ClaimStatus) {
    switch (s) {
      case 'FINAL_OFFER_MADE':
        return 'Final offer ready';
      case 'CLAIM_SETTLED':
        return 'Claim settled';
      case 'CLAIM_PAID':
        return 'Payment completed';
      case 'NEGOTIATION':
        return 'Negotiation in progress';
      case 'SUBMITTED_TO_INSURER':
        return 'Submitted to insurer';
      default:
        return 'Claim status updated';
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async mergeJson(id: string, dto: MergeClaimJsonDto, _adminId: string) {
    const claim = await this.prismaService.claim.findUnique({ where: { id } });
    if (!claim) throw new NotFoundException('Claim not found');

    const data: Prisma.ClaimUpdateInput = {};
    const merge = (curr: any, patch: any) => ({
      ...(curr ?? {}),
      ...(patch ?? {}),
    });

    if (dto.vehicleInfo)
      data.vehicleInfo = merge(claim.vehicleInfo, dto.vehicleInfo);
    if (dto.accidentInfo)
      data.accidentInfo = merge(claim.accidentInfo, dto.accidentInfo);
    if (dto.insuranceInfo)
      data.insuranceInfo = merge(claim.insuranceInfo, dto.insuranceInfo);
    if (dto.pricingPlan)
      data.pricingPlan = merge(claim.pricingPlan, dto.pricingPlan);
    if (dto.liabilityInfo)
      data.liabilityInfo = merge(claim.liabilityInfo, dto.liabilityInfo);

    data.updatedAt = new Date();
    data.lastAccessedAt = new Date();

    const updated = await this.prismaService.claim.update({
      where: { id },
      data,
    });

    return updated;
  }

  async patchVehicleInfo(id: string, dto: PatchVehicleInfoDto) {
    const claim = await this.prismaService.claim.findUnique({ where: { id } });
    if (!claim) throw new NotFoundException('Claim not found');
    const vehicleInfo = {
      ...(claim.vehicleInfo as any),
      ...(dto.vehicleInfo ?? {}),
    };
    return this.prismaService.claim.update({
      where: { id },
      data: { vehicleInfo, updatedAt: new Date(), lastAccessedAt: new Date() },
    });
  }

  async patchAccidentInfo(id: string, dto: PatchAccidentInfoDto) {
    const claim = await this.prismaService.claim.findUnique({ where: { id } });
    if (!claim) throw new NotFoundException('Claim not found');
    const accidentInfo = {
      ...(claim.accidentInfo as any),
      ...(dto.accidentInfo ?? {}),
    };
    return this.prismaService.claim.update({
      where: { id },
      data: { accidentInfo, updatedAt: new Date(), lastAccessedAt: new Date() },
    });
  }

  async patchInsuranceInfo(id: string, dto: PatchInsuranceInfoDto) {
    const claim = await this.prismaService.claim.findUnique({ where: { id } });
    if (!claim) throw new NotFoundException('Claim not found');
    const insuranceInfo = {
      ...(claim.insuranceInfo as any),
      ...(dto.insuranceInfo ?? {}),
    };
    return this.prismaService.claim.update({
      where: { id },
      data: {
        insuranceInfo,
        updatedAt: new Date(),
        lastAccessedAt: new Date(),
      },
    });
  }

  async patchLiabilityInfo(id: string, dto: PatchLiabilityInfoDto) {
    const claim = await this.prismaService.claim.findUnique({ where: { id } });
    if (!claim) throw new NotFoundException('Claim not found');
    const liabilityInfo = {
      ...(claim.liabilityInfo as any),
      ...(dto.liabilityInfo ?? {}),
    };
    return this.prismaService.claim.update({
      where: { id },
      data: {
        liabilityInfo,
        updatedAt: new Date(),
        lastAccessedAt: new Date(),
      },
    });
  }

  async stats(from?: string, to?: string): Promise<AdminStatsDto> {
    const dateFilter: Prisma.ClaimWhereInput =
      from || to
        ? {
            createdAt: {
              gte: from ? new Date(from) : undefined,
              lte: to ? new Date(to) : undefined,
            },
          }
        : {};

    const [
      totalClaims,
      activeClaims,
      closedClaims,
      disqualified,
      byStatusRaw,
      byStepRaw,
      allForAmounts,
    ] = await this.prismaService.$transaction([
      this.prismaService.claim.count({ where: dateFilter }),
      this.prismaService.claim.count({
        where: { ...dateFilter, status: { in: ACTIVE_STATUSES } },
      }),
      this.prismaService.claim.count({
        where: {
          ...dateFilter,
          status: {
            in: [
              ClaimStatus.CLAIM_PAID,
              ClaimStatus.CLOSED,
              ClaimStatus.CLAIM_SETTLED,
            ],
          },
        },
      }),
      this.prismaService.claim.count({
        where: { ...dateFilter, status: ClaimStatus.DISQUALIFIED },
      }),
      this.prismaService.claim.groupBy({
        by: ['status'],
        _count: { _all: true },
        where: dateFilter,
        orderBy: { status: 'asc' },
      }),
      this.prismaService.claim.groupBy({
        by: ['currentStep'],
        _count: { _all: true },
        where: dateFilter,
        orderBy: { currentStep: 'asc' },
      }),
      this.prismaService.claim.findMany({
        where: dateFilter,
        select: {
          pricingPlan: true,
          vehicleInfo: true,
          insuranceInfo: true,
          createdAt: true,
        },
      }),
    ]);

    // daily series via SQL (date_trunc) for efficiency
    const series = await this.prismaService.$queryRaw<
      { d: Date; c: bigint }[]
    >`SELECT date_trunc('day', "createdAt") as d, COUNT(*)::bigint as c FROM "claims"
      ${from || to ? Prisma.sql`WHERE "createdAt" BETWEEN ${from ? new Date(from) : new Date(0)} AND ${to ? new Date(to) : new Date()} ` : Prisma.empty}
      GROUP BY 1 ORDER BY 1`;

    const createdSeriesDaily = series.map((r) => ({
      date: r.d.toISOString().slice(0, 10),
      count: Number(r.c),
    }));

    // top insurers (extract from JSON client-side)
    const insurerCounts = new Map<string, number>();
    for (const row of allForAmounts) {
      const ii: any = row.insuranceInfo ?? {};
      const names = [ii.atFaultInsurance?.companyName].filter(
        Boolean,
      ) as string[];
      for (const name of names) {
        const key = String(name).trim();
        if (!key) continue;
        insurerCounts.set(key, (insurerCounts.get(key) ?? 0) + 1);
      }
    }
    const topInsurers = [...insurerCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    // documents count (approx): count rows with any of known doc fields
    const docsCount = await this.prismaService.claim.count({
      where: {
        OR: [
          {
            accidentInfo: {
              path: ['repairInvoiceFileUrl'],
              not: Prisma.DbNull,
            } as any,
          },
          {
            insuranceInfo: {
              path: ['autoInsuranceCardFileUrl'],
              not: Prisma.DbNull,
            } as any,
          },
          {
            insuranceInfo: {
              path: ['driverLicenseFrontFileUrl'],
              not: Prisma.DbNull,
            } as any,
          },
          {
            insuranceInfo: {
              path: ['driverLicenseBackFileUrl'],
              not: Prisma.DbNull,
            } as any,
          },
        ],
        ...dateFilter,
      },
    });

    // totalEstimatedAmount (derived)
    const totalEstimatedAmount = allForAmounts.reduce((sum, c) => {
      const pp: any = c.pricingPlan ?? {};
      const vi: any = c.vehicleInfo ?? {};
      const amount =
        this.num(pp.estimatedAmount) ||
        this.num(pp.dvEstimate) ||
        this.num(vi.repairCost) ||
        0;
      return sum + amount;
    }, 0);

    return {
      totals: { totalClaims, activeClaims, closedClaims, disqualified },
      byStatus: byStatusRaw.map((r) => ({
        status: r.status,
        count: r._count
          ? typeof r._count === 'object'
            ? (r._count._all ?? 0)
            : 0
          : 0,
      })),
      byStep: byStepRaw.map((r) => ({
        step: r.currentStep,
        count: r._count
          ? typeof r._count === 'object'
            ? (r._count._all ?? 0)
            : 0
          : 0,
      })),
      createdSeriesDaily,
      topInsurers,
      docsCount,
      totalEstimatedAmount,
    };
  }

  async listDocuments(page = 1, limit = 20) {
    const claims = await this.prismaService.claim.findMany({
      select: {
        id: true,
        userId: true,
        updatedAt: true,
        status: true,
        accidentInfo: true,
        insuranceInfo: true,
        pricingPlan: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    const all: AdminDocumentDto[] = claims.flatMap((c) =>
      this.extractDocumentsFromClaim(c.id, c.userId, c.status, c.updatedAt, c),
    );

    all.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());

    const total = all.length;
    const start = (page - 1) * limit;
    const data = all.slice(start, start + limit);

    return {
      data,
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

  async exportCsv(q: AdminClaimsQueryDto): Promise<string> {
    const res = await this.list({ ...q, page: 1, limit: 100000 }); // big page for export
    const rows = res.data as Array<any>;
    const header = [
      'claimId',
      'userId',
      'userEmail',
      'userPhone',
      'userName',
      'status',
      'currentStep',
      'createdAt',
      'updatedAt',
      'vehicleYear',
      'vehicleMake',
      'vehicleModel',
      'vin',
      'repairCost',
      'atFaultInsurance',
      'claimNumber',
      'adjusterName',
      'estimatedAmount',
    ];

    const csvRows: string[] = [];
    csvRows.push(header.join(','));

    for (const c of rows) {
      const vi: any = c.vehicleInfo ?? {};
      const ii: any = c.insuranceInfo ?? {};
      const pp: any = c.pricingPlan ?? {};
      const name = [c.user?.firstName, c.user?.lastName]
        .filter(Boolean)
        .join(' ')
        .trim();
      const estimatedAmount =
        this.num(pp.estimatedAmount) ||
        this.num(pp.dvEstimate) ||
        this.num(vi.repairCost) ||
        0;

      const vals = [
        c.id,
        c.userId,
        c.user?.email ?? '',
        c.user?.phoneNumber ?? '',
        name,
        c.status,
        String(c.currentStep),
        c.createdAt.toISOString(),
        c.updatedAt.toISOString(),
        vi.year ?? vi.vehicleYear ?? '',
        vi.make ?? vi.vehicleMake ?? '',
        vi.model ?? vi.vehicleModel ?? '',
        vi.vin ?? vi.vehicleVin ?? '',
        this.num(vi.repairCost) || '',
        ii.atFaultInsurance?.companyName ?? '',
        ii.claimNumber ?? '',
        ii.adjusterName ?? '',
        estimatedAmount,
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`);
      csvRows.push(vals.join(','));
    }

    return csvRows.join('\n');
  }

  private num(v: unknown): number | null {
    if (v == null) return null;
    if (typeof v === 'number') return Number.isFinite(v) ? v : null;
    if (typeof v === 'string') {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  }

  private extractDocumentsFromClaim(
    claimId: string,
    userId: string,
    status: ClaimStatus,
    ts: Date,
    c: {
      accidentInfo: Prisma.JsonValue | null;
      insuranceInfo: Prisma.JsonValue | null;
      pricingPlan: Prisma.JsonValue | null;
    },
  ): AdminDocumentDto[] {
    const docs: AdminDocumentDto[] = [];
    const pushIf = (type: string, fileName?: unknown, fileUrl?: unknown) => {
      const fName = typeof fileName === 'string' ? fileName : null;
      const fUrl = typeof fileUrl === 'string' ? fileUrl : null;
      if (fName && fUrl) {
        docs.push({
          claimId,
          userId,
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
      pushIf('signature', 'signature.png', pp.signatureDataUrl);
    }
    return docs;
  }
}
