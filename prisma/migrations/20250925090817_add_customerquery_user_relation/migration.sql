-- AlterTable
ALTER TABLE "public"."customer_queries" ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE INDEX "customer_queries_userId_createdAt_idx" ON "public"."customer_queries"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."customer_queries" ADD CONSTRAINT "customer_queries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
