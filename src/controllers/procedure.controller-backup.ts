import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { ApiResponse, PaginatedResponse } from '@/types';

/**
 * @swagger
 * components:
 *   schemas:
 *     Procedure:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID único do procedure
 *         name:
 *           type: string
 *           description: Nome do procedure
 *         status:
 *           type: string
 *           enum: [active, inactive, pending]
 *           description: Status do procedure
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Data de criação
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Data de atualização
 *       required:
 *         - id
 *         - name
 *         - status
 *     CreateProcedureRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Nome do procedure
 *         status:
 *           type: string
 *           enum: [active, inactive, pending]
 *           description: Status inicial
 *       required:
 *         - name
 *     UpdateProcedureRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Nome do procedure
 *         status:
 *           type: string
 *           enum: [active, inactive, pending]
 *           description: Status do procedure
 */

export class ProcedureController extends BaseController {
  
  /**
   * @swagger
   * /api/v1/procedures:
   *   get:
   *     summary: Listar procedures
   *     description: Retorna uma lista paginada de procedures
   *     tags:
   *       - Procedures
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
   *         name: search
   *         schema:
   *           type: string
   *         description: Termo de busca
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [active, inactive, pending]
   *         description: Filtrar por status
   *     responses:
   *       200:
   *         description: Lista de procedures recuperada com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/PaginatedResponse'
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string;
      const status = req.query.status as string;

      // Simular dados para demonstração
      const mockData = Array.from({ length: limit }, (_, i) => ({
        id: `procedure-${(page - 1) * limit + i + 1}`,
        name: `Procedure ${(page - 1) * limit + i + 1}`,
        status: ['active', 'inactive', 'pending'][i % 3],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      const response: ApiResponse<PaginatedResponse<any>> = {
        success: true,
        message: 'Procedures retrieved successfully',
        data: {
          items: mockData,
          pagination: {
            page,
            limit,
            total: 100,
            totalPages: Math.ceil(100 / limit),
            hasNext: page < Math.ceil(100 / limit),
            hasPrev: page > 1,
          },
        },
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      this.sendError(res, 'Failed to retrieve procedures', 500);
    }
  }

  /**
   * @swagger
   * /api/v1/procedures/{id}:
   *   get:
   *     summary: Obter procedure por ID
   *     description: Retorna um procedure específico pelo ID
   *     tags:
   *       - Procedures
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID do procedure
   *     responses:
   *       200:
   *         description: Procedure recuperado com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/Procedure'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Simular busca por ID
      const mockData = {
        id,
        name: `Procedure ${id}`,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.sendResponse(res, mockData, 'Procedure retrieved successfully');
    } catch (error) {
      this.sendError(res, 'Procedure not found', 404);
    }
  }

  /**
   * @swagger
   * /api/v1/procedures:
   *   post:
   *     summary: Criar novo procedure
   *     description: Cria um novo procedure
   *     tags:
   *       - Procedures
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateProcedureRequest'
   *     responses:
   *       201:
   *         description: Procedure criado com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/Procedure'
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { name, status } = req.body;

      // Simular criação
      const mockData = {
        id: `procedure-${Date.now()}`,
        name,
        status: status || 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      res.status(201);
      this.sendResponse(res, mockData, 'Procedure created successfully');
    } catch (error) {
      this.sendError(res, 'Failed to create procedure', 500);
    }
  }

  /**
   * @swagger
   * /api/v1/procedures/{id}:
   *   put:
   *     summary: Atualizar procedure
   *     description: Atualiza um procedure existente
   *     tags:
   *       - Procedures
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID do procedure
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateProcedureRequest'
   *     responses:
   *       200:
   *         description: Procedure atualizado com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/Procedure'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, status } = req.body;

      // Simular atualização
      const mockData = {
        id,
        name: name || `Procedure ${id}`,
        status: status || 'active',
        createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        updatedAt: new Date().toISOString(),
      };

      this.sendResponse(res, mockData, 'Procedure updated successfully');
    } catch (error) {
      this.sendError(res, 'Failed to update procedure', 500);
    }
  }

  /**
   * @swagger
   * /api/v1/procedures/{id}:
   *   delete:
   *     summary: Excluir procedure
   *     description: Exclui um procedure existente
   *     tags:
   *       - Procedures
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID do procedure
   *     responses:
   *       200:
   *         description: Procedure excluído com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiResponse'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Simular exclusão
      this.sendResponse(res, null, 'Procedure deleted successfully');
    } catch (error) {
      this.sendError(res, 'Failed to delete procedure', 500);
    }
  }
}
