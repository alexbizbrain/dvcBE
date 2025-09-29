-- CreateEnum
CREATE TYPE "public"."ClaimFlow" AS ENUM ('CALCULATOR_FORM', 'LIABILITY_MODAL');

-- AlterTable
ALTER TABLE "public"."claims" ADD COLUMN     "flow" "public"."ClaimFlow" NOT NULL DEFAULT 'CALCULATOR_FORM';
