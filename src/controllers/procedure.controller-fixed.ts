import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { ApiResponse, PaginatedResponse } from '@/types';
import { prisma } from '@/config/database';
import { logger } from '@/config/logger';

/**
 * Controller de procedimentos com implementação real usando Prisma
 */
export class ProcedureController extends BaseController {
  
  /**
   * Lista procedimentos com paginação
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string;
      const status = req.query.status as string;

      const skip = (page - 1) * limit;

      // Construir filtros
      const where: any = {
        deletedAt: null, // Não retornar deletados
      };

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (status) {
        where.status = status;
      }

      // Buscar procedimentos
      const [procedures, total] = await Promise.all([
        prisma.procedure.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            patient: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        }),
        prisma.procedure.count({ where }),
      ]);

      const response: ApiResponse<PaginatedResponse<any>> = {
        success: true,
        message: 'Procedures retrieved successfully',
        data: {
          items: procedures,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNext: page < Math.ceil(total / limit),
            hasPrev: page > 1,
          },
        },
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      logger.error('Failed to list procedures:', error);
      this.sendError(res, 'Failed to retrieve procedures', 500);
    }
  }

  /**
   * Busca procedimento por ID
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const procedure = await prisma.procedure.findFirst({
        where: {
          id,
          deletedAt: null,
        },
        include: {
          patient: true,
          surgicalTeam: true,
          materials: true,
          portValidations: true,
        },
      });

      if (!procedure) {
        this.sendError(res, 'Procedure not found', 404);
        return;
      }

      this.sendResponse(res, procedure, 'Procedure retrieved successfully');
    } catch (error) {
      logger.error('Failed to get procedure:', error);
      this.sendError(res, 'Procedure not found', 404);
    }
  }

  /**
   * Cria novo procedimento
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const {
        patientId,
        guiaId,
        code,
        name,
        description,
        category,
        subcategory,
        suggestedPort,
        actualPort,
        status,
        scheduledDate,
        performedDate,
        duration,
        estimatedDuration,
        basePrice,
        complexity,
        anesthesiaType,
        preOperativeExams,
        postOperativeInstructions,
        complications,
        notes,
        requiresAuthorization,
        tags,
        quantity,
        unitPrice,
        totalPrice,
        executionDate,
        reportedPorte,
        validatedPorte,
        porteValidation,
      } = req.body;

      logger.info('Creating procedure from XML importer:', { 
        code, 
        patientId, 
        guiaId 
      });

      // Verificar se o paciente existe (criar se não existir)
      let patient = null;
      if (patientId) {
        patient = await prisma.patient.findUnique({
          where: { id: patientId },
        });

        if (!patient) {
          // Criar paciente básico se não existir
          patient = await prisma.patient.create({
            data: {
              id: patientId,
              fullName: 'Paciente Importado',
              email: null,
              phone: null,
              birthDate: null,
            },
          });
          logger.info('Patient created:', { patientId });
        }
      }

      // Criar procedimento
      const procedure = await prisma.procedure.create({
        data: {
          code: code || `PROC-${Date.now()}`,
          name: name || description || 'Procedimento Importado',
          description: description || null,
          category: category || 'GENERAL_SURGERY',
          subcategory: subcategory || null,
          suggestedPort: suggestedPort || reportedPorte || validatedPorte || 1,
          actualPort: actualPort || reportedPorte || null,
          status: status || 'SCHEDULED',
          scheduledDate: scheduledDate || executionDate ? new Date(scheduledDate || executionDate) : null,
          performedDate: performedDate || executionDate ? new Date(performedDate || executionDate) : null,
          duration: duration || null,
          estimatedDuration: estimatedDuration || null,
          basePrice: basePrice || unitPrice || totalPrice || null,
          complexity: complexity || 'MEDIUM',
          anesthesiaType: anesthesiaType || null,
          preOperativeExams: preOperativeExams || [],
          postOperativeInstructions: postOperativeInstructions || null,
          complications: complications || null,
          notes: notes || (guiaId ? `Importado da guia ${guiaId}` : null),
          requiresAuthorization: requiresAuthorization || false,
          tags: tags || [],
          patientId: patient?.id || patientId,
        },
        include: {
          patient: true,
        },
      });

      logger.info('Procedure created successfully:', { 
        procedureId: procedure.id,
        code: procedure.code,
      });

      // Se houver validação de porte, criar registro
      if (porteValidation && (reportedPorte || validatedPorte)) {
        try {
          await prisma.portValidation.create({
            data: {
              procedureId: procedure.id,
              suggestedPort: validatedPorte || reportedPorte || 1,
              actualPort: reportedPorte || validatedPorte || 1,
              isValid: porteValidation.isValid || true,
              discrepancy: Math.abs((validatedPorte || 0) - (reportedPorte || 0)),
              reason: porteValidation.reason || null,
              validatedBy: 'system',
              validatedAt: new Date(),
            },
          });
          logger.info('Port validation created:', { procedureId: procedure.id });
        } catch (error) {
          logger.error('Failed to create port validation:', error);
          // Não bloqueia a criação do procedimento
        }
      }

      res.status(201);
      this.sendResponse(res, procedure, 'Procedure created successfully');
    } catch (error: any) {
      logger.error('Failed to create procedure:', error);
      
      // Verificar se é erro de unique constraint
      if (error.code === 'P2002') {
        this.sendError(res, 'Procedure code already exists', 400);
        return;
      }

      this.sendError(res, `Failed to create procedure: ${error.message}`, 500);
    }
  }

  /**
   * Atualiza procedimento
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const {
        name,
        description,
        status,
        actualPort,
        performedDate,
        duration,
        complications,
        notes,
      } = req.body;

      // Verificar se existe
      const existing = await prisma.procedure.findFirst({
        where: {
          id,
          deletedAt: null,
        },
      });

      if (!existing) {
        this.sendError(res, 'Procedure not found', 404);
        return;
      }

      // Atualizar
      const procedure = await prisma.procedure.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(description && { description }),
          ...(status && { status }),
          ...(actualPort && { actualPort }),
          ...(performedDate && { performedDate: new Date(performedDate) }),
          ...(duration && { duration }),
          ...(complications && { complications }),
          ...(notes && { notes }),
        },
        include: {
          patient: true,
        },
      });

      logger.info('Procedure updated:', { procedureId: id });
      this.sendResponse(res, procedure, 'Procedure updated successfully');
    } catch (error) {
      logger.error('Failed to update procedure:', error);
      this.sendError(res, 'Failed to update procedure', 500);
    }
  }

  /**
   * Deleta procedimento (soft delete)
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Verificar se existe
      const existing = await prisma.procedure.findFirst({
        where: {
          id,
          deletedAt: null,
        },
      });

      if (!existing) {
        this.sendError(res, 'Procedure not found', 404);
        return;
      }

      // Soft delete
      await prisma.procedure.update({
        where: { id },
        data: {
          deletedAt: new Date(),
        },
      });

      logger.info('Procedure deleted:', { procedureId: id });
      this.sendResponse(res, null, 'Procedure deleted successfully');
    } catch (error) {
      logger.error('Failed to delete procedure:', error);
      this.sendError(res, 'Failed to delete procedure', 500);
    }
  }

  /**
   * Valida porte de um procedimento
   */
  async validatePorte(req: Request, res: Response): Promise<void> {
    try {
      const { procedureCode, reportedPorte } = req.body;

      if (!procedureCode || !reportedPorte) {
        this.sendError(res, 'procedureCode and reportedPorte are required', 400);
        return;
      }

      logger.info('Validating porte:', { procedureCode, reportedPorte });

      // Buscar regra de validação de porte
      const rule = await prisma.portValidationRule.findFirst({
        where: {
          procedureCode,
          isActive: true,
        },
      });

      if (!rule) {
        // Se não houver regra, aceitar o porte informado
        this.sendResponse(res, {
          isValid: true,
          procedureCode,
          reportedPorte,
          expectedPorte: reportedPorte,
          severity: 'INFO',
          message: 'No validation rule found for this procedure',
        }, 'Porte validated successfully');
        return;
      }

      // Validar porte
      const reportedPorteNum = parseInt(reportedPorte);
      const isValid = reportedPorteNum >= rule.minimumPort && reportedPorteNum <= rule.maximumPort;
      const expectedPorte = rule.recommendedPort;

      let severity = 'INFO';
      if (!isValid) {
        const diff = Math.abs(reportedPorteNum - expectedPorte);
        if (diff >= 2) {
          severity = 'HIGH';
        } else if (diff === 1) {
          severity = 'MEDIUM';
        } else {
          severity = 'LOW';
        }
      }

      const response = {
        isValid,
        procedureCode,
        reportedPorte: reportedPorteNum,
        expectedPorte,
        minimumPorte: rule.minimumPort,
        maximumPorte: rule.maximumPort,
        severity,
        message: isValid 
          ? 'Porte is within acceptable range'
          : `Porte divergence detected. Expected: ${expectedPorte}, Reported: ${reportedPorteNum}`,
      };

      logger.info('Porte validation result:', response);
      this.sendResponse(res, response, 'Porte validated successfully');
    } catch (error) {
      logger.error('Failed to validate porte:', error);
      this.sendError(res, 'Failed to validate porte', 500);
    }
  }
}

