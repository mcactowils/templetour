-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "temple_schedules" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "templeId" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "temple_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_attendees" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scheduleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "schedule_attendees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_comments" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,

    CONSTRAINT "schedule_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "schedule_attendees_scheduleId_userId_key" ON "schedule_attendees"("scheduleId", "userId");

-- AddForeignKey - TempleTour.userId -> User.id
ALTER TABLE "temple_tours" ADD COLUMN IF NOT EXISTS "user_id" TEXT;

-- Update existing userId column mapping if needed
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'temple_tours' AND column_name = 'userId'
        AND NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'temple_tours' AND column_name = 'user_id'
        )
    ) THEN
        ALTER TABLE "temple_tours" RENAME COLUMN "userId" TO "user_id";
    END IF;
END $$;

-- AddForeignKey
ALTER TABLE "temple_tours" ADD CONSTRAINT "temple_tours_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temple_schedules" ADD CONSTRAINT "temple_schedules_templeId_fkey" FOREIGN KEY ("templeId") REFERENCES "temples"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temple_schedules" ADD CONSTRAINT "temple_schedules_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_attendees" ADD CONSTRAINT "schedule_attendees_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "temple_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_attendees" ADD CONSTRAINT "schedule_attendees_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_comments" ADD CONSTRAINT "schedule_comments_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "temple_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_comments" ADD CONSTRAINT "schedule_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
