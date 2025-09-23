/*
  Warnings:

  - You are about to drop the column `hitAndRun` on the `liability_claims` table. All the data in the column will be lost.
  - Made the column `userId` on table `liability_claims` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."liability_claims" DROP CONSTRAINT "liability_claims_userId_fkey";

-- AlterTable
ALTER TABLE "public"."liability_claims" DROP COLUMN "hitAndRun",
ALTER COLUMN "userId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."liability_claims" ADD CONSTRAINT "liability_claims_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
