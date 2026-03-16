-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "auctionDate" TEXT,
ADD COLUMN     "isAuction" BOOLEAN NOT NULL DEFAULT false;
