import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import {
  CreateInsuranceCompanyDto,
  UpdateInsuranceCompanyDto,
  ListInsuranceCompaniesQuery,
} from './dto/insurance-company.dto';
import { InsuranceType, Prisma } from '@prisma/client';

@Injectable()
export class InsuranceService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateInsuranceCompanyDto) {
    return this.prisma.insuranceCompany.create({
      data: {
        companyName: dto.companyName,
        contactEmail: dto.contactEmail,
        naic: dto.naic,
        insuranceType: dto.insuranceType,
        websiteUrl: dto.websiteUrl,
        companyLicensed: dto.companyLicensed,
        companyInformation: dto.companyInformation,
      },
    });
  }

  async findById(id: string) {
    const item = await this.prisma.insuranceCompany.findUnique({
      where: { id },
    });
    if (!item) throw new Error('Insurance company not found');
    return item;
  }

  private buildWhere(
    q: ListInsuranceCompaniesQuery,
  ): Prisma.InsuranceCompanyWhereInput {
    const and: Prisma.InsuranceCompanyWhereInput[] = [];

    if (q.q) {
      and.push({
        OR: [
          { companyName: { contains: q.q, mode: 'insensitive' } },
          { contactEmail: { contains: q.q, mode: 'insensitive' } },
          { naic: { contains: q.q, mode: 'insensitive' } },
          { websiteUrl: { contains: q.q, mode: 'insensitive' } },
          { companyInformation: { contains: q.q, mode: 'insensitive' } },
        ],
      });
    }

    // exacts and contains
    if (q.name)
      and.push({ companyName: { equals: q.name, mode: 'insensitive' } });
    if (q.nameContains)
      and.push({
        companyName: { contains: q.nameContains, mode: 'insensitive' },
      });

    if (q.email)
      and.push({ contactEmail: { equals: q.email, mode: 'insensitive' } });
    if (q.emailContains)
      and.push({
        contactEmail: { contains: q.emailContains, mode: 'insensitive' },
      });

    if (q.naic) and.push({ naic: { equals: q.naic } });
    if (q.naicContains)
      and.push({ naic: { contains: q.naicContains, mode: 'insensitive' } });

    if (q.websiteContains)
      and.push({
        websiteUrl: { contains: q.websiteContains, mode: 'insensitive' },
      });

    if (q.insuranceTypeIn?.length)
      and.push({ insuranceType: { in: q.insuranceTypeIn as any } });

    if (q.licensedState) {
      and.push({
        companyLicensed: {
          path: ['licensedStates'],
          array_contains: q.licensedState,
        } as any,
      });
    }
    if (q.licenseNumberEquals) {
      and.push({
        companyLicensed: {
          path: ['licenseNumber'],
          equals: q.licenseNumberEquals,
        } as any,
      });
    }

    // date range on createdAt
    if (q.createdFrom || q.createdTo) {
      and.push({
        createdAt: {
          gte: q.createdFrom ? new Date(q.createdFrom) : undefined,
          lt: q.createdTo ? new Date(q.createdTo) : undefined,
        },
      });
    }

    return and.length ? { AND: and } : {};
  }

  async list(q: ListInsuranceCompaniesQuery) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'updatedAt',
      sortOrder = 'desc',
      cursor,
    } = q;

    const where = this.buildWhere(q);

    if (cursor) {
      const items = await this.prisma.insuranceCompany.findMany({
        where,
        take: limit,
        skip: 1,
        cursor: { id: cursor },
        orderBy: { [sortBy]: sortOrder as Prisma.SortOrder },
      });
      const nextCursor =
        items.length === limit ? items[items.length - 1].id : null;
      return { items, nextCursor };
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.insuranceCompany.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder as Prisma.SortOrder },
      }),
      this.prisma.insuranceCompany.count({ where }),
    ]);

    return {
      items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async update(id: string, dto: UpdateInsuranceCompanyDto) {
    try {
      return await this.prisma.insuranceCompany.update({
        where: { id },
        data: {
          companyName: dto.companyName,
          contactEmail: dto.contactEmail,
          naic: dto.naic,
          insuranceType: dto.insuranceType as InsuranceType | undefined,
          websiteUrl: dto.websiteUrl,
          companyLicensed:
            (dto.companyLicensed as Prisma.InputJsonValue) ?? undefined,
          companyInformation: dto.companyInformation,
        },
      });
    } catch (e: any) {
      if (e?.code === 'P2002') {
        throw new Error(
          'Company with this name and insurance type already exists.',
        );
      }
      throw e;
    }
  }

  async remove(id: string) {
    await this.prisma.insuranceCompany.delete({ where: { id } });
    return { id, deleted: true };
  }
}
