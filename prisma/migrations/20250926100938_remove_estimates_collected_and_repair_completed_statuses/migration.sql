/*
  Warnings:

  - The values [ESTIMATES_COLLECTED,REPAIR_COMPLETED] on the enum `ClaimStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."ClaimStatus_new" AS ENUM ('DISQUALIFIED', 'INPROGRESS', 'REPAIR_COST_PENDING', 'DV_CLAIM_CREATED', 'SUBMITTED_TO_INSURER', 'NEGOTIATION', 'FINAL_OFFER_MADE', 'CLAIM_SETTLED', 'CLAIM_PAID', 'CLOSED');
ALTER TABLE "public"."claims" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."claims" ALTER COLUMN "status" TYPE "public"."ClaimStatus_new" USING ("status"::text::"public"."ClaimStatus_new");
ALTER TYPE "public"."ClaimStatus" RENAME TO "ClaimStatus_old";
ALTER TYPE "public"."ClaimStatus_new" RENAME TO "ClaimStatus";
DROP TYPE "public"."ClaimStatus_old";
ALTER TABLE "public"."claims" ALTER COLUMN "status" SET DEFAULT 'INPROGRESS';
COMMIT;
