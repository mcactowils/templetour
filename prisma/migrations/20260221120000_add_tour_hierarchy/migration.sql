-- CreateEnum
CREATE TYPE "TourRole" AS ENUM ('ORGANIZER', 'MEMBER');

-- CreateTable
CREATE TABLE "tours" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_by_id" TEXT NOT NULL,

    CONSTRAINT "tours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tour_members" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tourId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "TourRole" NOT NULL DEFAULT 'MEMBER',

    CONSTRAINT "tour_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tour_comments" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tourId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,

    CONSTRAINT "tour_comments_pkey" PRIMARY KEY ("id")
);

-- Add tourId to temple_schedules
ALTER TABLE "temple_schedules" ADD COLUMN "tourId" TEXT;

-- DropTable (remove the old TempleTour table)
DROP TABLE IF EXISTS "temple_tours";

-- CreateIndex
CREATE UNIQUE INDEX "tour_members_tourId_userId_key" ON "tour_members"("tourId", "userId");

-- AddForeignKey
ALTER TABLE "tours" ADD CONSTRAINT "tours_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tour_members" ADD CONSTRAINT "tour_members_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "tours"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tour_members" ADD CONSTRAINT "tour_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tour_comments" ADD CONSTRAINT "tour_comments_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "tours"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tour_comments" ADD CONSTRAINT "tour_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temple_schedules" ADD CONSTRAINT "temple_schedules_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "tours"("id") ON DELETE CASCADE ON UPDATE CASCADE;
