-- CreateTable
CREATE TABLE "UserProperty" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "address" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "sqm" DOUBLE PRECISION NOT NULL,
    "monthlyRent" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'valutazione',
    "purchaseDate" TEXT,
    "acquisitionCosts" DOUBLE PRECISION,
    "notes" TEXT,
    "vacancyRate" DOUBLE PRECISION NOT NULL DEFAULT 8,
    "maintenanceRate" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "annualCondoFees" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProperty_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserProperty" ADD CONSTRAINT "UserProperty_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
