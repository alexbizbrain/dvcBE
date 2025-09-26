/*
  Warnings:

  - You are about to drop the `liability_claims` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."liability_claims" DROP CONSTRAINT "liability_claims_userId_fkey";

-- DropTable
DROP TABLE "public"."liability_claims";
