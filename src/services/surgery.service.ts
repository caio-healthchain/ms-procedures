import { PrismaClient } from '@prisma/client';
import { logger } from '../config/logger';
import { 
  SurgeryProcedure,
  SurgeryComplexity,
  SurgeryStatus,
  AuthorizationStatus,
  AuditStatus,
  CreateSurgeryRequest,
  UpdateSurgeryRequest,
  ConfirmPorteRequest,
  SurgerySearchFilters,
  SurgeryStatistics,
  PendingSurgerySummary
} from '../types/surgery.types';
import { ApiResponse, PaginatedResponse, PaginationParams } from '../types/common.types';
import { eventBusService } from '../config/eventbus';

const prisma = new PrismaClient();

export class SurgeryService {

  async createSurgery(data: CreateSurgeryRequest): Promise<ApiResponse<SurgeryProcedure>> {
    try {
      // Verificar se o paciente existe
      const patient = await prisma.patient.findUnique({
        where: { id: data.patientId }
      });

      if (!patient) {
        throw new Error('Patient not found');
      }

      // Calcular preço base baseado na complexidade
      const basePrice = this.calculateBasePrice(data.complexity, data.estimatedDuration);

      // Criar procedimento
      const procedure = await prisma.procedure.create({
        data: {
          code: data.procedureCode,
          name: data.procedureName,
          description: data.description,
          category: data.category as any,
          subcategory: data.subcategory,
          complexity: data.complexity as any,
          estimatedDuration: data.estimatedDuration,
          basePrice: basePrice,
          status: 'SCHEDULED' as any,
          patientId: data.patientId,
          requiresAuthorization: data.requiresAuthorization || false,
          suggestedPort: 1, // Valor padrão
          tags: [
            'surgery',
            data.complexity,
            data.category,
            data.hospital
          ]
        }
      });

      const surgeryProcedure: SurgeryProcedure = {
        id: procedure.id,
        patientId: data.patientId,
        patientName: patient.fullName,
        procedureCode: data.procedureCode,
        procedureName: data.procedureName,
        description: data.description,
        category: data.category,
        subcategory: data.subcategory,
        complexity: data.complexity,
        estimatedDuration: data.estimatedDuration,
        basePrice: basePrice,
        status: SurgeryStatus.SCHEDULED,
        scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : undefined,
        surgeonId: data.surgeonId,
        surgeonName: data.surgeonName,
        assistants: data.assistants,
        anesthesiologist: data.anesthesiologist,
        operatingRoom: data.operatingRoom,
        hospital: data.hospital,
        requiresAuthorization: data.requiresAuthorization || false,
        authorizationStatus: data.requiresAuthorization ? AuthorizationStatus.PENDING : AuthorizationStatus.NOT_REQUIRED,
        auditStatus: AuditStatus.PENDING_AUDIT,
        createdAt: procedure.createdAt,
        updatedAt: procedure.updatedAt,
        createdBy: data.createdBy
      };

      // Publicar evento
      await eventBusService.publishSurgeryCreated(surgeryProcedure);

      // Se requer auditoria, criar item de auditoria
      if (this.requiresAudit(data.complexity)) {
        await this.createAuditRequest(surgeryProcedure);
      }

      logger.info('Surgery procedure created:', { 
        surgeryId: surgeryProcedure.id, 
        complexity: data.complexity,
        patientId: data.patientId 
      });

      return {
        success: true,
        data: surgeryProcedure,
        message: 'Surgery procedure created successfully',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to create surgery procedure:', error);
      throw error;
    }
  }

  async getSurgeryById(id: string): Promise<ApiResponse<SurgeryProcedure>> {
    try {
      const procedure = await prisma.procedure.findUnique({
        where: { id },
        include: { patient: true }
      });

      if (!procedure) {
        throw new Error('Surgery procedure not found');
      }

      const surgeryProcedure = this.mapProcedureToSurgery(procedure);

      return {
        success: true,
        data: surgeryProcedure,
        message: 'Surgery procedure retrieved successfully',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to get surgery procedure:', error);
      throw error;
    }
  }

  async searchSurgeries(filters: SurgerySearchFilters, pagination: PaginationParams): Promise<ApiResponse<PaginatedResponse<SurgeryProcedure>>> {
    try {
      const where: any = {
        tags: {
          has: 'surgery'
        }
      };

      if (filters.patientId) {
        where.patientId = filters.patientId;
      }

      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.complexity) {
        where.complexity = filters.complexity;
      }

      if (filters.category) {
        where.category = filters.category;
      }

      if (filters.dateFrom || filters.dateTo) {
        where.createdAt = {};
        if (filters.dateFrom) {
          where.createdAt.gte = new Date(filters.dateFrom);
        }
        if (filters.dateTo) {
          where.createdAt.lte = new Date(filters.dateTo);
        }
      }

      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { code: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } }
        ];
      }

      const [procedures, total] = await Promise.all([
        prisma.procedure.findMany({
          where,
          include: { patient: true },
          skip: ((pagination.page || 1) - 1) * (pagination.limit || 10),
          take: pagination.limit || 10,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.procedure.count({ where })
      ]);

      const surgeryProcedures = procedures.map(proc => this.mapProcedureToSurgery(proc));

      return {
        success: true,
        data: {
          items: surgeryProcedures,
          pagination: {
            page: pagination.page || 1,
            limit: pagination.limit || 10,
            total,
            totalPages: Math.ceil(total / (pagination.limit || 10)),
            hasNext: (pagination.page || 1) < Math.ceil(total / (pagination.limit || 10)),
            hasPrev: (pagination.page || 1) > 1
          }
        },
        message: 'Surgery procedures retrieved successfully',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to search surgery procedures:', error);
      throw error;
    }
  }

  async confirmPorte(id: string, confirmation: ConfirmPorteRequest): Promise<ApiResponse<SurgeryProcedure>> {
    try {
      const procedure = await prisma.procedure.findUnique({
        where: { id },
        include: { patient: true }
      });

      if (!procedure) {
        throw new Error('Surgery procedure not found');
      }

      // Atualizar procedimento com confirmação de porte
      const updatedProcedure = await prisma.procedure.update({
        where: { id },
        data: {
          complexity: confirmation.complexity as any,
          estimatedDuration: confirmation.estimatedDuration,
          basePrice: confirmation.basePrice,
          updatedAt: new Date()
        },
        include: { patient: true }
      });

      // Criar log de auditoria
      await prisma.auditLog.create({
        data: {
          action: 'UPDATE',
          entity: 'PROCEDURE',
          entityId: id,
          userId: confirmation.confirmedBy,
          userName: confirmation.confirmedBy,
          userRole: 'SURGEON',
          oldValues: {
            complexity: procedure.complexity,
            estimatedDuration: procedure.estimatedDuration,
            basePrice: procedure.basePrice
          },
          newValues: {
            complexity: confirmation.complexity,
            estimatedDuration: confirmation.estimatedDuration,
            basePrice: confirmation.basePrice,
            notes: confirmation.notes,
            action: 'PORTE_CONFIRMED'
          },
          patientId: procedure.patientId,
          procedureId: id
        }
      });

      const surgeryProcedure = this.mapProcedureToSurgery(updatedProcedure);

      // Publicar evento
      await eventBusService.publishPorteConfirmed(surgeryProcedure);

      logger.info('Surgery porte confirmed:', { 
        surgeryId: id, 
        complexity: confirmation.complexity,
        confirmedBy: confirmation.confirmedBy 
      });

      return {
        success: true,
        data: surgeryProcedure,
        message: 'Surgery porte confirmed successfully',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to confirm surgery porte:', error);
      throw error;
    }
  }

  async updateSurgeryStatus(id: string, status: SurgeryStatus, updatedBy: string): Promise<ApiResponse<SurgeryProcedure>> {
    try {
      const procedure = await prisma.procedure.findUnique({
        where: { id },
        include: { patient: true }
      });

      if (!procedure) {
        throw new Error('Surgery procedure not found');
      }

      const updatedProcedure = await prisma.procedure.update({
        where: { id },
        data: {
          status: status as any,
          updatedAt: new Date()
        },
        include: { patient: true }
      });

      // Criar log de auditoria
      await prisma.auditLog.create({
        data: {
          action: 'UPDATE',
          entity: 'PROCEDURE',
          entityId: id,
          userId: updatedBy,
          userName: updatedBy,
          userRole: 'MEDICAL_STAFF',
          oldValues: { status: procedure.status },
          newValues: { status: status },
          patientId: procedure.patientId,
          procedureId: id
        }
      });

      const surgeryProcedure = this.mapProcedureToSurgery(updatedProcedure);

      // Publicar evento
      await eventBusService.publishSurgeryStatusUpdated(surgeryProcedure);

      logger.info('Surgery status updated:', { 
        surgeryId: id, 
        status: status,
        updatedBy: updatedBy 
      });

      return {
        success: true,
        data: surgeryProcedure,
        message: 'Surgery status updated successfully',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to update surgery status:', error);
      throw error;
    }
  }

  async getPendingSurgeries(): Promise<ApiResponse<PendingSurgerySummary>> {
    try {
      const procedures = await prisma.procedure.findMany({
        where: {
          tags: { has: 'surgery' },
          status: { in: ['SCHEDULED', 'CONFIRMED'] as any }
        },
        include: { patient: true },
        orderBy: { createdAt: 'asc' }
      });

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

      const summary: PendingSurgerySummary = {
        totalPending: procedures.length,
        pendingAuthorization: procedures.filter(p => p.requiresAuthorization).length,
        pendingAudit: procedures.filter(p => this.requiresAudit(p.complexity as SurgeryComplexity)).length,
        scheduledToday: procedures.filter(p => {
          // Simular data agendada baseada na criação
          const scheduledDate = new Date(p.createdAt.getTime() + 24 * 60 * 60 * 1000);
          return scheduledDate >= today && scheduledDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
        }).length,
        scheduledThisWeek: procedures.filter(p => {
          const scheduledDate = new Date(p.createdAt.getTime() + 24 * 60 * 60 * 1000);
          return scheduledDate >= today && scheduledDate < nextWeek;
        }).length,
        recentActivity: procedures.slice(0, 10).map(p => this.mapProcedureToSurgery(p))
      };

      return {
        success: true,
        data: summary,
        message: 'Pending surgeries summary retrieved successfully',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to get pending surgeries:', error);
      throw error;
    }
  }

  private mapProcedureToSurgery(procedure: any): SurgeryProcedure {
    return {
      id: procedure.id,
      patientId: procedure.patientId!,
      patientName: procedure.patient?.fullName || 'Unknown',
      procedureCode: procedure.code,
      procedureName: procedure.name,
      description: procedure.description,
      category: procedure.category,
      subcategory: procedure.subcategory,
      complexity: procedure.complexity as SurgeryComplexity,
      estimatedDuration: procedure.estimatedDuration || 0,
      basePrice: procedure.basePrice ? parseFloat(procedure.basePrice.toString()) : 0,
      status: procedure.status as SurgeryStatus,
      scheduledDate: procedure.scheduledDate,
      performedDate: procedure.performedDate,
      surgeonId: 'surgeon-1', // Mock data
      surgeonName: 'Dr. Silva', // Mock data
      assistants: ['Dr. Santos', 'Dr. Costa'], // Mock data
      anesthesiologist: 'Dr. Oliveira', // Mock data
      operatingRoom: procedure.tags?.find((tag: string) => tag.startsWith('room-')) || 'Sala 1',
      hospital: procedure.tags?.find((tag: string) => tag.includes('hospital')) || 'Hospital Principal',
      requiresAuthorization: procedure.requiresAuthorization,
      authorizationStatus: procedure.requiresAuthorization ? AuthorizationStatus.PENDING : AuthorizationStatus.NOT_REQUIRED,
      auditStatus: this.requiresAudit(procedure.complexity as SurgeryComplexity) ? AuditStatus.PENDING_AUDIT : AuditStatus.NOT_REQUIRED,
      createdAt: procedure.createdAt,
      updatedAt: procedure.updatedAt,
      createdBy: 'system' // Mock data
    };
  }

  private calculateBasePrice(complexity: SurgeryComplexity, duration: number): number {
    const baseRates = {
      [SurgeryComplexity.PORTE_1]: 500,
      [SurgeryComplexity.PORTE_2]: 1500,
      [SurgeryComplexity.PORTE_3]: 3000,
      [SurgeryComplexity.PORTE_4]: 5000,
      [SurgeryComplexity.PORTE_ESPECIAL]: 8000
    };

    const baseRate = baseRates[complexity] || 1000;
    const durationMultiplier = Math.max(1, duration / 60); // Por hora
    
    return Math.round(baseRate * durationMultiplier);
  }

  private requiresAudit(complexity: SurgeryComplexity): boolean {
    return [
      SurgeryComplexity.PORTE_3,
      SurgeryComplexity.PORTE_4,
      SurgeryComplexity.PORTE_ESPECIAL
    ].includes(complexity);
  }

  private async createAuditRequest(surgery: SurgeryProcedure): Promise<void> {
    try {
      // Criar solicitação de auditoria via Event Bus
      await eventBusService.publishAuditRequested({
        patientId: surgery.patientId,
        procedureId: surgery.id,
        type: 'PORTE_CLASSIFICATION',
        priority: surgery.complexity === SurgeryComplexity.PORTE_ESPECIAL ? 'URGENT' : 'HIGH',
        description: `Auditoria de classificação de porte para ${surgery.procedureName}`,
        requestedBy: 'system',
        metadata: {
          complexity: surgery.complexity,
          estimatedDuration: surgery.estimatedDuration,
          basePrice: surgery.basePrice
        }
      });

      logger.info('Audit request created for surgery:', { surgeryId: surgery.id });
    } catch (error) {
      logger.error('Failed to create audit request:', error);
    }
  }
}
