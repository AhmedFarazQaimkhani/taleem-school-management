-- CreateEnum
CREATE TYPE "PayrollStatus" AS ENUM ('PENDING', 'PAID');

-- AlterTable
ALTER TABLE "PlatformSubscriptionPayment" ADD COLUMN "dueDate" TIMESTAMP(3);
ALTER TABLE "PlatformSubscriptionPayment" ADD COLUMN "reminderSentAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "PayrollPayment" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "periodLabel" TEXT NOT NULL,
    "amountPaisa" INTEGER NOT NULL,
    "status" "PayrollStatus" NOT NULL DEFAULT 'PENDING',
    "method" TEXT,
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayrollPayment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PayrollPayment_schoolId_staffId_periodLabel_key" ON "PayrollPayment"("schoolId", "staffId", "periodLabel");
CREATE INDEX "PayrollPayment_schoolId_idx" ON "PayrollPayment"("schoolId");

ALTER TABLE "PayrollPayment" ADD CONSTRAINT "PayrollPayment_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PayrollPayment" ADD CONSTRAINT "PayrollPayment_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE UNIQUE INDEX "Timetable_schoolId_sectionId_dayOfWeek_startTime_key" ON "Timetable"("schoolId", "sectionId", "dayOfWeek", "startTime");
