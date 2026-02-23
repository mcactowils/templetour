-- CreateEnum
CREATE TYPE "TempleStatus" AS ENUM ('ANNOUNCED', 'UNDER_CONSTRUCTION', 'DEDICATED', 'RENOVATING', 'CLOSED');

-- CreateTable
CREATE TABLE "temples" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "state" TEXT,
    "city" TEXT NOT NULL,
    "address" TEXT,
    "telephone" TEXT,
    "announcementDate" TIMESTAMP(3),
    "groundbreakingDate" TIMESTAMP(3),
    "dedicationDate" TIMESTAMP(3),
    "siteSize" TEXT,
    "exteriorFinish" TEXT,
    "totalFloorArea" TEXT,
    "elevation" TEXT,
    "instructionRooms" INTEGER,
    "sealingRooms" INTEGER,
    "baptistry" BOOLEAN NOT NULL DEFAULT false,
    "spires" INTEGER,
    "angelMoroni" BOOLEAN NOT NULL DEFAULT false,
    "visitorsCenter" BOOLEAN NOT NULL DEFAULT false,
    "arrivalCenter" BOOLEAN NOT NULL DEFAULT false,
    "patronHousing" BOOLEAN NOT NULL DEFAULT false,
    "distributionCenter" BOOLEAN NOT NULL DEFAULT false,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "status" "TempleStatus" NOT NULL DEFAULT 'ANNOUNCED',

    CONSTRAINT "temples_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "temple_tours" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "templeId" TEXT NOT NULL,
    "userId" TEXT,
    "visitDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "rating" INTEGER,

    CONSTRAINT "temple_tours_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "temples_name_key" ON "temples"("name");

-- CreateIndex
CREATE UNIQUE INDEX "temples_slug_key" ON "temples"("slug");

-- AddForeignKey
ALTER TABLE "temple_tours" ADD CONSTRAINT "temple_tours_templeId_fkey" FOREIGN KEY ("templeId") REFERENCES "temples"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
