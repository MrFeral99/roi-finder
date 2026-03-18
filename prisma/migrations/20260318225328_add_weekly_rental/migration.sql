-- AlterTable
ALTER TABLE "UserProperty" ADD COLUMN     "rentalMode" TEXT NOT NULL DEFAULT 'monthly',
ADD COLUMN     "weeklyRates" JSONB;
