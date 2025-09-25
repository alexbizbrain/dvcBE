import { ClaimStatus } from '@prisma/client';

export type AdminDocumentDto = {
  claimId: string;
  userId: string;
  type: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: Date;
  claimStatus: ClaimStatus;
};
