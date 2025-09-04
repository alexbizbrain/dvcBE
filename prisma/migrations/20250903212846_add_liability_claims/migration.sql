-- CreateTable
CREATE TABLE "public"."liability_claims" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "phoneNumber" TEXT,
    "countryCode" TEXT NOT NULL DEFAULT 'us',
    "atFaultDriver" BOOLEAN NOT NULL,
    "state" TEXT NOT NULL,
    "agreeToEmails" BOOLEAN NOT NULL DEFAULT false,
    "agreeToSms" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "liability_claims_pkey" PRIMARY KEY ("id")
);
