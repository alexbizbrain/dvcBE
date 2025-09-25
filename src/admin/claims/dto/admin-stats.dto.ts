import { ClaimStatus } from '@prisma/client';

export type AdminStatsDto = {
  totals: {
    totalClaims: number;
    activeClaims: number;
    closedClaims: number;
    disqualified: number;
  };
  byStatus: { status: ClaimStatus; count: number }[];
  byStep: { step: number; count: number }[];
  createdSeriesDaily: { date: string; count: number }[];
  topInsurers: { name: string; count: number }[];
  docsCount: number;
  totalEstimatedAmount: number; // derived from JSON; see service
};
