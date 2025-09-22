-- CreateEnum
CREATE TYPE "ProcedureCategory" AS ENUM ('GENERAL_SURGERY', 'CARDIAC_SURGERY', 'ORTHOPEDIC_SURGERY', 'NEUROSURGERY', 'PLASTIC_SURGERY', 'GYNECOLOGICAL_SURGERY', 'UROLOGICAL_SURGERY', 'OPHTHALMOLOGICAL_SURGERY', 'OTOLARYNGOLOGICAL_SURGERY', 'VASCULAR_SURGERY', 'THORACIC_SURGERY', 'PEDIATRIC_SURGERY', 'EMERGENCY_SURGERY', 'DIAGNOSTIC_PROCEDURE', 'THERAPEUTIC_PROCEDURE');

-- CreateEnum
CREATE TYPE "ProcedureStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'POSTPONED', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ProcedureComplexity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH');

-- CreateEnum
CREATE TYPE "AnesthesiaType" AS ENUM ('LOCAL', 'REGIONAL', 'GENERAL', 'SEDATION', 'NONE');

-- CreateEnum
CREATE TYPE "SurgicalRole" AS ENUM ('MAIN_SURGEON', 'ASSISTANT_SURGEON', 'ANESTHESIOLOGIST', 'NURSE', 'TECHNICIAN', 'RESIDENT');

-- CreateEnum
CREATE TYPE "MaterialStatus" AS ENUM ('REQUESTED', 'APPROVED', 'DELIVERED', 'USED', 'RETURNED', 'EXPIRED', 'REJECTED');

-- CreateEnum
CREATE TYPE "MaterialUrgency" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "MaterialRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'ORDERED', 'DELIVERED', 'CANCELLED');

-- CreateTable
CREATE TABLE "procedures" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "ProcedureCategory" NOT NULL,
    "suggestedPort" INTEGER NOT NULL,
    "actualPort" INTEGER,
    "status" "ProcedureStatus" NOT NULL DEFAULT 'SCHEDULED',
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "performedDate" TIMESTAMP(3),
    "duration" INTEGER NOT NULL,
    "complexity" "ProcedureComplexity" NOT NULL,
    "anesthesiaType" "AnesthesiaType" NOT NULL,
    "preOperativeExams" TEXT[],
    "postOperativeInstructions" TEXT NOT NULL,
    "complications" TEXT,
    "notes" TEXT,
    "patientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "procedures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "surgical_team_members" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "SurgicalRole" NOT NULL,
    "crm" TEXT,
    "specialty" TEXT,
    "procedureId" TEXT NOT NULL,

    CONSTRAINT "surgical_team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "procedure_materials" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "totalPrice" DECIMAL(10,2) NOT NULL,
    "supplier" TEXT,
    "batchNumber" TEXT,
    "expirationDate" TIMESTAMP(3),
    "status" "MaterialStatus" NOT NULL DEFAULT 'REQUESTED',
    "procedureId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "procedure_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "port_validations" (
    "id" TEXT NOT NULL,
    "suggestedPort" INTEGER NOT NULL,
    "actualPort" INTEGER NOT NULL,
    "isValid" BOOLEAN NOT NULL,
    "discrepancy" INTEGER NOT NULL,
    "reason" TEXT,
    "validatedBy" TEXT,
    "validatedAt" TIMESTAMP(3),
    "procedureId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "port_validations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "port_validation_rules" (
    "id" TEXT NOT NULL,
    "procedureCode" TEXT NOT NULL,
    "procedureName" TEXT NOT NULL,
    "category" "ProcedureCategory" NOT NULL,
    "complexity" "ProcedureComplexity" NOT NULL,
    "minimumPort" INTEGER NOT NULL,
    "maximumPort" INTEGER NOT NULL,
    "recommendedPort" INTEGER NOT NULL,
    "factors" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "port_validation_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_requests" (
    "id" TEXT NOT NULL,
    "procedureId" TEXT NOT NULL,
    "materialCode" TEXT NOT NULL,
    "materialName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "urgency" "MaterialUrgency" NOT NULL DEFAULT 'MEDIUM',
    "requestedBy" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "status" "MaterialRequestStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "material_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "procedures_code_key" ON "procedures"("code");

-- CreateIndex
CREATE UNIQUE INDEX "port_validation_rules_procedureCode_key" ON "port_validation_rules"("procedureCode");

-- AddForeignKey
ALTER TABLE "surgical_team_members" ADD CONSTRAINT "surgical_team_members_procedureId_fkey" FOREIGN KEY ("procedureId") REFERENCES "procedures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procedure_materials" ADD CONSTRAINT "procedure_materials_procedureId_fkey" FOREIGN KEY ("procedureId") REFERENCES "procedures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "port_validations" ADD CONSTRAINT "port_validations_procedureId_fkey" FOREIGN KEY ("procedureId") REFERENCES "procedures"("id") ON DELETE CASCADE ON UPDATE CASCADE;
