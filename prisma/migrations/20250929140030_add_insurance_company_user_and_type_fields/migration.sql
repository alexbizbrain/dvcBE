-- CreateEnum
CREATE TYPE "public"."InsuranceCompanyType" AS ENUM ('SYSTEM', 'CUSTOM');

-- AlterTable
ALTER TABLE "public"."insurance_companies" ADD COLUMN     "type" "public"."InsuranceCompanyType" NOT NULL DEFAULT 'SYSTEM',
ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE INDEX "idx_insurance_company_user" ON "public"."insurance_companies"("userId");

-- AddForeignKey
ALTER TABLE "public"."insurance_companies" ADD CONSTRAINT "insurance_companies_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
