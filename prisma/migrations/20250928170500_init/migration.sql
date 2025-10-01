-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ProcedureComplexity" ADD VALUE 'PORTE_1';
ALTER TYPE "ProcedureComplexity" ADD VALUE 'PORTE_2';
ALTER TYPE "ProcedureComplexity" ADD VALUE 'PORTE_3';
ALTER TYPE "ProcedureComplexity" ADD VALUE 'PORTE_4';
ALTER TYPE "ProcedureComplexity" ADD VALUE 'PORTE_ESPECIAL';

-- AlterEnum
ALTER TYPE "ProcedureStatus" ADD VALUE 'CONFIRMED';

-- AlterTable
ALTER TABLE "procedures" ADD COLUMN     "basePrice" DECIMAL(10,2),
ADD COLUMN     "estimatedDuration" INTEGER,
ADD COLUMN     "requiresAuthorization" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "subcategory" TEXT,
ADD COLUMN     "tags" TEXT[],
ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "scheduledDate" DROP NOT NULL,
ALTER COLUMN "duration" DROP NOT NULL,
ALTER COLUMN "anesthesiaType" DROP NOT NULL,
ALTER COLUMN "postOperativeInstructions" DROP NOT NULL;

-- CreateTable
CREATE TABLE "patients" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "birthDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "userRole" TEXT NOT NULL,
    "oldValues" JSONB,
    "newValues" JSONB,
    "patientId" TEXT,
    "procedureId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "procedures" ADD CONSTRAINT "procedures_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
