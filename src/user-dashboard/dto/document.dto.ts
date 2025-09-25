import { ClaimStatus } from '@prisma/client';

export type DocumentDto = {
  claimId: string;
  type: string; // e.g. 'repairInvoice', 'driverLicenseFront', etc.
  fileName: string;
  fileUrl: string;
  uploadedAt: Date; // using claim.updatedAt as proxy timestamp
  claimStatus: ClaimStatus;
};
