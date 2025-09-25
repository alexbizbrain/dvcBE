import { ClaimStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateClaimStatusDto {
  @IsEnum(ClaimStatus)
  status!: ClaimStatus;
}
