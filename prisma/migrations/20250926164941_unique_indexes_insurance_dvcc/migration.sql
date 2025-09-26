/*
  Warnings:

  - The primary key for the `insurance_companies` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `addedBy` on the `insurance_companies` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name,insuranceType]` on the table `insurance_companies` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `insuranceType` to the `insurance_companies` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."InsuranceType" AS ENUM ('AUTO', 'COMMERCIAL_AUTO');

-- AlterTable
ALTER TABLE "public"."insurance_companies" DROP CONSTRAINT "insurance_companies_pkey",
DROP COLUMN "addedBy",
ADD COLUMN     "companyInformation" TEXT,
ADD COLUMN     "companyLicensed" JSONB,
ADD COLUMN     "insuranceType" "public"."InsuranceType" NOT NULL,
ADD COLUMN     "naic" TEXT,
ADD COLUMN     "websiteUrl" TEXT,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "insurance_companies_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "insurance_companies_id_seq";

-- CreateTable
CREATE TABLE "public"."dvcc_configurations" (
    "id" TEXT NOT NULL,
    "minApproxCarPrice" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "maxApproxCarPrice" DECIMAL(65,30) NOT NULL DEFAULT 100000000,
    "minApproxCarPriceActive" BOOLEAN NOT NULL DEFAULT false,
    "maxApproxCarPriceActive" BOOLEAN NOT NULL DEFAULT false,
    "minTotalRepairCost" DECIMAL(65,30),
    "minTotalRepairCostActive" BOOLEAN NOT NULL DEFAULT false,
    "maxTotalRepairCost" DECIMAL(65,30),
    "maxTotalRepairCostActive" BOOLEAN NOT NULL DEFAULT false,
    "contingencyPlanPercentage" DECIMAL(5,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dvcc_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_insurance_company_type" ON "public"."insurance_companies"("insuranceType");

-- CreateIndex
CREATE UNIQUE INDEX "insurance_companies_name_insuranceType_key" ON "public"."insurance_companies"("name", "insuranceType");
