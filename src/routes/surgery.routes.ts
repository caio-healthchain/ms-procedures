import { Router } from 'express';
import { SurgeryController } from '../controllers/surgery.controller';
import { asyncHandler } from '../middleware/error-handler';

const router = Router();
const controller = new SurgeryController();

/**
 * @swagger
 * tags:
 *   name: Surgeries
 *   description: Operações relacionadas a procedimentos cirúrgicos
 */

// Rotas principais de CRUD
router.get('/', asyncHandler(controller.list.bind(controller)));
router.get('/pending', asyncHandler(controller.getPending.bind(controller)));
router.get('/:id', asyncHandler(controller.getById.bind(controller)));
router.post('/', asyncHandler(controller.create.bind(controller)));

// Rotas específicas de cirurgia
router.post('/:id/confirm-porte', asyncHandler(controller.confirmPorte.bind(controller)));
router.put('/:id/status', asyncHandler(controller.updateStatus.bind(controller)));

export default router;
