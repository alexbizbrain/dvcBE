-- AlterTable
ALTER TABLE "public"."notifications" ADD COLUMN     "emailSentAt" TIMESTAMP(3),
ADD COLUMN     "smsSentAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "public"."user_notification_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "enableEmailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "enableSmsNotifications" BOOLEAN NOT NULL DEFAULT false,
    "emailDigestTime" TEXT NOT NULL DEFAULT '18:00',
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_notification_preferences_userId_key" ON "public"."user_notification_preferences"("userId");

-- CreateIndex
CREATE INDEX "idx_notification_email_sent" ON "public"."notifications"("userId", "emailSentAt");

-- CreateIndex
CREATE INDEX "idx_notification_sms_sent" ON "public"."notifications"("userId", "smsSentAt");

-- AddForeignKey
ALTER TABLE "public"."user_notification_preferences" ADD CONSTRAINT "user_notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
