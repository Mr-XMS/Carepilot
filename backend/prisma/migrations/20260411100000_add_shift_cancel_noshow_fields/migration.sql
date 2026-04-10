-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'CANCEL_SHIFT';
ALTER TYPE "AuditAction" ADD VALUE 'NO_SHOW';

-- AlterTable
ALTER TABLE "shifts" ADD COLUMN "cancelledAt" TIMESTAMP(3),
ADD COLUMN "cancelledByUserId" TEXT,
ADD COLUMN "cancellationReason" TEXT,
ADD COLUMN "noShowMarkedAt" TIMESTAMP(3),
ADD COLUMN "noShowMarkedByUserId" TEXT;

-- AddForeignKey
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_cancelledByUserId_fkey" FOREIGN KEY ("cancelledByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_noShowMarkedByUserId_fkey" FOREIGN KEY ("noShowMarkedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
