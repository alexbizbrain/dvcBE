/*
  Warnings:

  - You are about to drop the column `maxApproxCarPrice` on the `dvcc_configurations` table. All the data in the column will be lost.
  - You are about to drop the column `maxApproxCarPriceActive` on the `dvcc_configurations` table. All the data in the column will be lost.
  - You are about to drop the column `maxTotalRepairCost` on the `dvcc_configurations` table. All the data in the column will be lost.
  - You are about to drop the column `maxTotalRepairCostActive` on the `dvcc_configurations` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."dvcc_configurations" DROP COLUMN "maxApproxCarPrice",
DROP COLUMN "maxApproxCarPriceActive",
DROP COLUMN "maxTotalRepairCost",
DROP COLUMN "maxTotalRepairCostActive";
