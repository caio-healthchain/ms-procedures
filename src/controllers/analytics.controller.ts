import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analytics.service';
import { logger } from '../config/logger';

export class AnalyticsController {
  private analyticsService: AnalyticsService;

  constructor() {
    this.analyticsService = new AnalyticsService();
  }

  /**
   * GET /api/v1/analytics/procedures/top
   * Retorna os procedimentos mais realizados
   */
  async getTopProcedures(req: Request, res: Response): Promise<void> {
    try {
      const { period = 'month', date, limit = '10' } = req.query;
      const targetDate = date ? new Date(date as string) : new Date();
      const limitNum = parseInt(limit as string, 10);

      logger.info(`[Analytics] Buscando top procedimentos (período: ${period})`);

      const topProcedures = await this.analyticsService.getTopProcedures(
        period as string,
        targetDate,
        limitNum
      );

      res.json({
        success: true,
        data: topProcedures,
        period,
        date: targetDate.toISOString().split('T')[0]
      });
    } catch (error) {
      logger.error('[Analytics] Erro ao buscar top procedimentos:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar procedimentos mais realizados'
      });
    }
  }

  /**
   * GET /api/v1/analytics/procedures/statistics
   * Retorna estatísticas gerais de procedimentos
   */
  async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const { period = 'month', date } = req.query;
      const targetDate = date ? new Date(date as string) : new Date();

      logger.info(`[Analytics] Buscando estatísticas (período: ${period})`);

      const stats = await this.analyticsService.getProcedureStats(
        period as string,
        targetDate
      );

      res.json({
        success: true,
        data: stats,
        period,
        date: targetDate.toISOString().split('T')[0]
      });
    } catch (error) {
      logger.error('[Analytics] Erro ao buscar estatísticas:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar estatísticas de procedimentos'
      });
    }
  }

  /**
   * GET /api/v1/analytics/procedures/efficiency
   * Retorna métricas de eficiência operacional
   */
  async getEfficiency(req: Request, res: Response): Promise<void> {
    try {
      const { period = 'month', date } = req.query;
      const targetDate = date ? new Date(date as string) : new Date();

      logger.info(`[Analytics] Buscando métricas de eficiência (período: ${period})`);

      const efficiency = await this.analyticsService.getEfficiencyMetrics(
        period as string,
        targetDate
      );

      res.json({
        success: true,
        data: efficiency,
        period,
        date: targetDate.toISOString().split('T')[0]
      });
    } catch (error) {
      logger.error('[Analytics] Erro ao buscar eficiência:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar métricas de eficiência'
      });
    }
  }

  /**
   * GET /api/v1/analytics/procedures/category/:category
   * Análise detalhada por categoria
   */
  async getCategoryAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const { category } = req.params;
      const { period = 'month', date } = req.query;
      const targetDate = date ? new Date(date as string) : new Date();

      logger.info(`[Analytics] Buscando análise da categoria ${category}`);

      const analysis = await this.analyticsService.getCategoryAnalysis(
        category as any,
        period as string,
        targetDate
      );

      res.json({
        success: true,
        data: analysis,
        period,
        date: targetDate.toISOString().split('T')[0]
      });
    } catch (error) {
      logger.error('[Analytics] Erro ao buscar análise de categoria:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar análise de categoria'
      });
    }
  }

  /**
   * GET /api/v1/analytics/procedures/by-period
   * Lista procedimentos por período
   */
  async getProceduresByPeriod(req: Request, res: Response): Promise<void> {
    try {
      const { period = 'day', date, status } = req.query;
      const targetDate = date ? new Date(date as string) : new Date();

      logger.info(`[Analytics] Buscando procedimentos por período (${period})`);

      const procedures = await this.analyticsService.getProceduresByPeriod(
        period as string,
        targetDate,
        status as any
      );

      res.json({
        success: true,
        data: procedures,
        count: procedures.length,
        period,
        date: targetDate.toISOString().split('T')[0]
      });
    } catch (error) {
      logger.error('[Analytics] Erro ao buscar procedimentos por período:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar procedimentos por período'
      });
    }
  }

  /**
   * GET /api/v1/analytics/procedures/history
   * Retorna histórico completo de procedimentos realizados
   */
  async getProceduresHistory(req: Request, res: Response): Promise<void> {
    try {
      logger.info('[Analytics] Buscando histórico completo de procedimentos');

      const history = await this.analyticsService.getProceduresHistory();

      res.json({
        success: true,
        data: history
      });
    } catch (error) {
      logger.error('[Analytics] Erro ao buscar histórico de procedimentos:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar histórico de procedimentos'
      });
    }
  }
}
