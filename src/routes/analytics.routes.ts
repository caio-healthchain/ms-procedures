import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';

const router = Router();
const analyticsController = new AnalyticsController();

/**
 * @swagger
 * /api/v1/analytics/procedures/top:
 *   get:
 *     summary: Retorna os procedimentos mais realizados
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month, quarter, year]
 *           default: month
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Top procedimentos realizados
 */
router.get('/procedures/top', (req, res) => 
  analyticsController.getTopProcedures(req, res)
);

/**
 * @swagger
 * /api/v1/analytics/procedures/statistics:
 *   get:
 *     summary: Retorna estatísticas gerais de procedimentos
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month, quarter, year]
 *           default: month
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Estatísticas de procedimentos
 */
router.get('/procedures/statistics', (req, res) => 
  analyticsController.getStatistics(req, res)
);

/**
 * @swagger
 * /api/v1/analytics/procedures/efficiency:
 *   get:
 *     summary: Retorna métricas de eficiência operacional
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month, quarter, year]
 *           default: month
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Métricas de eficiência
 */
router.get('/procedures/efficiency', (req, res) => 
  analyticsController.getEfficiency(req, res)
);

/**
 * @swagger
 * /api/v1/analytics/procedures/category/{category}:
 *   get:
 *     summary: Análise detalhada por categoria
 *     tags: [Analytics]
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month, quarter, year]
 *           default: month
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Análise da categoria
 */
router.get('/procedures/category/:category', (req, res) => 
  analyticsController.getCategoryAnalysis(req, res)
);

/**
 * @swagger
 * /api/v1/analytics/procedures/by-period:
 *   get:
 *     summary: Lista procedimentos por período
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month, quarter, year]
 *           default: day
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED]
 *     responses:
 *       200:
 *         description: Lista de procedimentos
 */
router.get('/procedures/by-period', (req, res) => 
  analyticsController.getProceduresByPeriod(req, res)
);

export default router;
