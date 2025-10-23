import { Router } from 'express';
import { ProcedureController } from '@/controllers/procedure.controller';
import { asyncHandler } from '@/middleware/error-handler';

const router = Router();
const controller = new ProcedureController();

/**
 * @swagger
 * tags:
 *   name: Procedures
 *   description: Operações relacionadas a procedures
 */

// Validação de porte (deve vir antes das rotas com :id)
router.post('/validate-porte', asyncHandler(controller.validatePorte.bind(controller)));

// CRUD routes
router.get('/', asyncHandler(controller.list.bind(controller)));
router.get('/:id', asyncHandler(controller.getById.bind(controller)));
router.post('/', asyncHandler(controller.create.bind(controller)));
router.put('/:id', asyncHandler(controller.update.bind(controller)));
router.delete('/:id', asyncHandler(controller.delete.bind(controller)));

export default router;

