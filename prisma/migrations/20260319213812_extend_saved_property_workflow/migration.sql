/*
  Warnings:

  - Added the required column `updatedAt` to the `SavedProperty` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SavedProperty" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'COLLECTION',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
