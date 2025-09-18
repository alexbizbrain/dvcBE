-- AlterTable
ALTER TABLE "public"."liability_claims" ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE INDEX "idx_liability_claims_email" ON "public"."liability_claims"("email");

-- CreateIndex
CREATE INDEX "idx_liability_claims_phone_number" ON "public"."liability_claims"("phoneNumber");

-- AddForeignKey
ALTER TABLE "public"."liability_claims" ADD CONSTRAINT "liability_claims_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
