-- CreateTable
CREATE TABLE "public"."calculator_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentStep" INTEGER NOT NULL DEFAULT 1,
    "isSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "lastAccessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vehicleYear" TEXT,
    "vehicleMake" TEXT,
    "vehicleModel" TEXT,
    "vehicleVin" TEXT,
    "vehicleMileage" TEXT,
    "accidentDate" TEXT,
    "isAtFault" BOOLEAN,
    "isRepaired" BOOLEAN,
    "repairCost" TEXT,
    "approximateCarPrice" TEXT,
    "repairInvoiceFileName" TEXT,
    "repairInvoiceFileUrl" TEXT,
    "nextAction" TEXT DEFAULT 'file-claim',
    "yourInsurance" TEXT,
    "claimNumber" TEXT,
    "atFaultInsurance" TEXT,
    "adjusterName" TEXT,
    "adjusterEmail" TEXT,
    "adjusterPhone" TEXT,
    "adjusterCountryCode" TEXT DEFAULT '+1',
    "driverName" TEXT,
    "driverEmail" TEXT,
    "driverPhone" TEXT,
    "driverCountryCode" TEXT DEFAULT '+1',
    "selectedPlan" TEXT DEFAULT 'contingency',
    "agreedToTerms" BOOLEAN NOT NULL DEFAULT false,
    "signatureDataUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calculator_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "calculator_progress_userId_key" ON "public"."calculator_progress"("userId");

-- AddForeignKey
ALTER TABLE "public"."calculator_progress" ADD CONSTRAINT "calculator_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
