/*
  Warnings:

  - The `status` column on the `claims` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "public"."ClaimStatus" AS ENUM ('DISQUALIFIED', 'INPROGRESS', 'ESTIMATES_COLLECTED', 'REPAIR_COMPLETED', 'DV_CLAIM_CREATED', 'SUBMITTED_TO_INSURER', 'NEGOTIATION', 'FINAL_OFFER_MADE', 'CLAIM_SETTLED', 'CLAIM_PAID', 'CLOSED');

-- AlterTable
ALTER TABLE "public"."claims" ADD COLUMN     "liabilityInfo" JSONB,
DROP COLUMN "status",
ADD COLUMN     "status" "public"."ClaimStatus" NOT NULL DEFAULT 'INPROGRESS';
