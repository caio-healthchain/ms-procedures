import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { SurgeryService } from '../services/surgery.service';
import { 
  CreateSurgeryRequest,
  UpdateSurgeryRequest,
  ConfirmPorteRequest,
  SurgerySearchFilters,
  SurgeryComplexity,
  SurgeryStatus,
  AuthorizationStatus,
  AuditStatus
} from '../types/surgery.types';
import { PaginationParams } from '../types/common.types';

export class SurgeryController extends BaseController {
  private surgeryService: SurgeryService;

  constructor() {
    super();
    this.surgeryService = new SurgeryService();
  }

  /**
   * @swagger
   * /api/v1/surgeries:
   *   get:
   *     summary: Listar procedimentos cirúrgicos
   *     description: Retorna uma lista paginada de procedimentos cirúrgicos com filtros
   *     tags:
   *       - Surgeries
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *         description: Número da página
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 20
   *         description: Itens por página
   *       - in: query
   *         name: patientId
   *         schema:
   *           type: string
   *         description: Filtrar por ID do paciente
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [SCHEDULED, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, POSTPONED]
   *         description: Filtrar por status
   *       - in: query
   *         name: complexity
   *         schema:
   *           type: string
   *           enum: [PORTE_1, PORTE_2, PORTE_3, PORTE_4, PORTE_ESPECIAL]
   *         description: Filtrar por complexidade/porte
   *     responses:
   *       200:
   *         description: Lista de cirurgias recuperada com sucesso
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const pagination: PaginationParams = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20
      };

      const filters: SurgerySearchFilters = {
        patientId: req.query.patientId as string,
        surgeonId: req.query.surgeonId as string,
        status: req.query.status as SurgeryStatus,
        complexity: req.query.complexity as SurgeryComplexity,
        authorizationStatus: req.query.authorizationStatus as AuthorizationStatus,
        auditStatus: req.query.auditStatus as AuditStatus,
        category: req.query.category as string,
        hospital: req.query.hospital as string,
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string,
        search: req.query.search as string
      };

      const result = await this.surgeryService.searchSurgeries(filters, pagination);
      res.json(result);
    } catch (error) {
      this.sendError(res, 'Failed to retrieve surgery procedures', 500);
    }
  }

  /**
   * @swagger
   * /api/v1/surgeries/{id}:
   *   get:
   *     summary: Obter procedimento cirúrgico por ID
   *     description: Retorna um procedimento cirúrgico específico pelo ID
   *     tags:
   *       - Surgeries
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID do procedimento cirúrgico
   *     responses:
   *       200:
   *         description: Procedimento cirúrgico recuperado com sucesso
   *       404:
   *         description: Procedimento cirúrgico não encontrado
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await this.surgeryService.getSurgeryById(id);
      res.json(result);
    } catch (error) {
      if (error instanceof Error && error.message === 'Surgery procedure not found') {
        this.sendError(res, 'Surgery procedure not found', 404);
      } else {
        this.sendError(res, 'Failed to retrieve surgery procedure', 500);
      }
    }
  }

  /**
   * @swagger
   * /api/v1/surgeries:
   *   post:
   *     summary: Criar novo procedimento cirúrgico
   *     description: Cria um novo procedimento cirúrgico
   *     tags:
   *       - Surgeries
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - patientId
   *               - procedureCode
   *               - procedureName
   *               - category
   *               - complexity
   *               - estimatedDuration
   *               - surgeonId
   *               - surgeonName
   *               - hospital
   *               - createdBy
   *             properties:
   *               patientId:
   *                 type: string
   *                 description: ID do paciente
   *               procedureCode:
   *                 type: string
   *                 description: Código do procedimento
   *               procedureName:
   *                 type: string
   *                 description: Nome do procedimento
   *               category:
   *                 type: string
   *                 description: Categoria do procedimento
   *               complexity:
   *                 type: string
   *                 enum: [PORTE_1, PORTE_2, PORTE_3, PORTE_4, PORTE_ESPECIAL]
   *                 description: Complexidade/porte do procedimento
   *               estimatedDuration:
   *                 type: integer
   *                 description: Duração estimada em minutos
   *               surgeonId:
   *                 type: string
   *                 description: ID do cirurgião
   *               surgeonName:
   *                 type: string
   *                 description: Nome do cirurgião
   *               hospital:
   *                 type: string
   *                 description: Hospital onde será realizada
   *               createdBy:
   *                 type: string
   *                 description: Usuário que criou o procedimento
   *     responses:
   *       201:
   *         description: Procedimento cirúrgico criado com sucesso
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const createRequest: CreateSurgeryRequest = {
        patientId: req.body.patientId,
        procedureCode: req.body.procedureCode,
        procedureName: req.body.procedureName,
        description: req.body.description,
        category: req.body.category,
        subcategory: req.body.subcategory,
        complexity: req.body.complexity,
        estimatedDuration: req.body.estimatedDuration,
        scheduledDate: req.body.scheduledDate,
        surgeonId: req.body.surgeonId,
        surgeonName: req.body.surgeonName,
        assistants: req.body.assistants,
        anesthesiologist: req.body.anesthesiologist,
        operatingRoom: req.body.operatingRoom,
        hospital: req.body.hospital,
        requiresAuthorization: req.body.requiresAuthorization,
        createdBy: req.body.createdBy
      };

      const result = await this.surgeryService.createSurgery(createRequest);
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof Error && error.message === 'Patient not found') {
        this.sendError(res, 'Patient not found', 404);
      } else {
        this.sendError(res, 'Failed to create surgery procedure', 500);
      }
    }
  }

  /**
   * @swagger
   * /api/v1/surgeries/{id}/confirm-porte:
   *   post:
   *     summary: Confirmar porte cirúrgico
   *     description: Confirma a classificação de porte de um procedimento cirúrgico
   *     tags:
   *       - Surgeries
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID do procedimento cirúrgico
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - complexity
   *               - estimatedDuration
   *               - basePrice
   *               - confirmedBy
   *             properties:
   *               complexity:
   *                 type: string
   *                 enum: [PORTE_1, PORTE_2, PORTE_3, PORTE_4, PORTE_ESPECIAL]
   *                 description: Complexidade/porte confirmado
   *               estimatedDuration:
   *                 type: integer
   *                 description: Duração estimada confirmada em minutos
   *               basePrice:
   *                 type: number
   *                 description: Preço base confirmado
   *               confirmedBy:
   *                 type: string
   *                 description: Usuário que confirmou o porte
   *               notes:
   *                 type: string
   *                 description: Observações sobre a confirmação
   *     responses:
   *       200:
   *         description: Porte cirúrgico confirmado com sucesso
   */
  async confirmPorte(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const confirmation: ConfirmPorteRequest = {
        complexity: req.body.complexity,
        estimatedDuration: req.body.estimatedDuration,
        basePrice: req.body.basePrice,
        confirmedBy: req.body.confirmedBy,
        notes: req.body.notes
      };

      const result = await this.surgeryService.confirmPorte(id, confirmation);
      res.json(result);
    } catch (error) {
      if (error instanceof Error && error.message === 'Surgery procedure not found') {
        this.sendError(res, 'Surgery procedure not found', 404);
      } else {
        this.sendError(res, 'Failed to confirm surgery porte', 500);
      }
    }
  }

  /**
   * @swagger
   * /api/v1/surgeries/{id}/status:
   *   put:
   *     summary: Atualizar status do procedimento cirúrgico
   *     description: Atualiza o status de um procedimento cirúrgico
   *     tags:
   *       - Surgeries
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID do procedimento cirúrgico
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - status
   *               - updatedBy
   *             properties:
   *               status:
   *                 type: string
   *                 enum: [SCHEDULED, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, POSTPONED]
   *                 description: Novo status do procedimento
   *               updatedBy:
   *                 type: string
   *                 description: Usuário que atualizou o status
   *     responses:
   *       200:
   *         description: Status do procedimento atualizado com sucesso
   */
  async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, updatedBy } = req.body;

      const result = await this.surgeryService.updateSurgeryStatus(id, status, updatedBy);
      res.json(result);
    } catch (error) {
      if (error instanceof Error && error.message === 'Surgery procedure not found') {
        this.sendError(res, 'Surgery procedure not found', 404);
      } else {
        this.sendError(res, 'Failed to update surgery status', 500);
      }
    }
  }

  /**
   * @swagger
   * /api/v1/surgeries/pending:
   *   get:
   *     summary: Obter resumo de cirurgias pendentes
   *     description: Retorna um resumo das cirurgias pendentes
   *     tags:
   *       - Surgeries
   *     responses:
   *       200:
   *         description: Resumo de cirurgias pendentes recuperado com sucesso
   */
  async getPending(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.surgeryService.getPendingSurgeries();
      res.json(result);
    } catch (error) {
      this.sendError(res, 'Failed to retrieve pending surgeries', 500);
    }
  }
}
