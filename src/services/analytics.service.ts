import { PrismaClient, ProcedureCategory, ProcedureStatus, ProcedureComplexity } from '@prisma/client';
import { logger } from '../config/logger';

const prisma = new PrismaClient();

export interface TopProcedure {
  code: string;
  name: string;
  category: string;
  total_realizados: number;
  valor_total: number;
  valor_medio: number;
  duracao_media: number;
}

export interface ProcedureStats {
  total_procedimentos: number;
  realizados: number;
  agendados: number;
  cancelados: number;
  taxa_realizacao: number;
  duracao_media: number;
  valor_total: number;
  valor_medio: number;
  por_categoria: Array<{
    categoria: string;
    quantidade: number;
    percentual: number;
  }>;
  por_complexidade: Array<{
    complexidade: string;
    quantidade: number;
    percentual: number;
  }>;
}

export interface ProcedureEfficiency {
  procedimentos_no_prazo: number;
  procedimentos_atrasados: number;
  taxa_pontualidade: number;
  tempo_medio_atraso: number;
  utilizacao_sala: number;
  procedimentos_por_dia: number;
}

export interface CategoryAnalysis {
  categoria: string;
  total_procedimentos: number;
  valor_total: number;
  duracao_total: number;
  duracao_media: number;
  procedimentos_complexos: number;
  taxa_complicacoes: number;
}

export class AnalyticsService {
  private hospitalId: string = 'hosp_sagrada_familia_001';

  /**
   * Retorna os procedimentos mais realizados
   */
  async getTopProcedures(
    period: string = 'month',
    date: Date = new Date(),
    limit: number = 10,
    hospitalId?: string
  ): Promise<TopProcedure[]> {
    try {
      const hId = hospitalId || this.hospitalId;
      const { startDate, endDate } = this.getPeriodDates(period, date);

      const procedures = await prisma.procedure.groupBy({
        by: ['code', 'name', 'category'],
        where: {
          hospitalId: hId,
          performedDate: {
            gte: startDate,
            lte: endDate,
            not: null
          }
        },
        _count: {
          id: true
        },
        _sum: {
          basePrice: true,
          duration: true
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        },
        take: limit
      });

      return procedures.map(proc => ({
        code: proc.code,
        name: proc.name,
        category: proc.category,
        total_realizados: proc._count.id,
        valor_total: Number(proc._sum.basePrice || 0),
        valor_medio: proc._count.id > 0 ? Number(proc._sum.basePrice || 0) / proc._count.id : 0,
        duracao_media: proc._count.id > 0 ? Number(proc._sum.duration || 0) / proc._count.id : 0
      }));
    } catch (error) {
      logger.error('[Analytics] Erro ao buscar top procedimentos:', error);
      throw error;
    }
  }

  /**
   * Retorna estatísticas gerais de procedimentos
   */
  async getProcedureStats(period: string = 'month', date: Date = new Date(), hospitalId?: string): Promise<ProcedureStats> {
    try {
      const hId = hospitalId || this.hospitalId;
      const { startDate, endDate } = this.getPeriodDates(period, date);

      const total_procedimentos = await prisma.procedure.count({
        where: {
          hospitalId: hId,
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      const realizados = await prisma.procedure.count({
        where: {
          hospitalId: hId,
          performedDate: {
            gte: startDate,
            lte: endDate,
            not: null
          }
        }
      });

      const agendados = await prisma.procedure.count({
        where: {
          hospitalId: hId,
          status: 'SCHEDULED',
          scheduledDate: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      const cancelados = await prisma.procedure.count({
        where: {
          hospitalId: hId,
          status: 'CANCELLED',
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      const aggregates = await prisma.procedure.aggregate({
        where: {
          hospitalId: hId,
          performedDate: {
            gte: startDate,
            lte: endDate,
            not: null
          }
        },
        _avg: {
          duration: true,
          basePrice: true
        },
        _sum: {
          basePrice: true
        }
      });

      // Por categoria
      const byCategory = await prisma.procedure.groupBy({
        by: ['category'],
        where: {
          hospitalId: hId,
          performedDate: {
            gte: startDate,
            lte: endDate,
            not: null
          }
        } as any,
        _count: {
          id: true
        }
      });

      const por_categoria = byCategory.map(cat => ({
        categoria: cat.category,
        quantidade: cat._count.id,
        percentual: realizados > 0 ? (cat._count.id / realizados) * 100 : 0
      }));

      // Por complexidade
      const byComplexity = await prisma.procedure.groupBy({
        by: ['complexity'],
        where: {
          hospitalId: hId,
          performedDate: {
            gte: startDate,
            lte: endDate,
            not: null
          }
        } as any,
        _count: {
          id: true
        }
      });

      const por_complexidade = byComplexity.map(comp => ({
        complexidade: comp.complexity,
        quantidade: comp._count.id,
        percentual: realizados > 0 ? (comp._count.id / realizados) * 100 : 0
      }));

      return {
        total_procedimentos,
        realizados,
        agendados,
        cancelados,
        taxa_realizacao: total_procedimentos > 0 ? (realizados / total_procedimentos) * 100 : 0,
        duracao_media: Number(aggregates._avg.duration || 0),
        valor_total: Number(aggregates._sum.basePrice || 0),
        valor_medio: Number(aggregates._avg.basePrice || 0),
        por_categoria,
        por_complexidade
      };
    } catch (error) {
      logger.error('[Analytics] Erro ao buscar estatísticas:', error);
      throw error;
    }
  }

  /**
   * Retorna métricas de eficiência operacional
   */
  async getEfficiencyMetrics(period: string = 'month', date: Date = new Date(), hospitalId?: string): Promise<ProcedureEfficiency> {
    try {
      const hId = hospitalId || this.hospitalId;
      const { startDate, endDate } = this.getPeriodDates(period, date);

      const procedures = await prisma.procedure.findMany({
        where: {
          hospitalId: hId,
          performedDate: {
            gte: startDate,
            lte: endDate,
            not: null
          }
        },
        select: {
          scheduledDate: true,
          performedDate: true,
          duration: true,
          estimatedDuration: true
        }
      });

      let procedimentos_no_prazo = 0;
      let procedimentos_atrasados = 0;
      let total_atraso = 0;
      let total_duracao = 0;

      procedures.forEach(proc => {
        if (proc.scheduledDate && proc.performedDate) {
          const diffMs = proc.performedDate.getTime() - proc.scheduledDate.getTime();
          const diffHours = diffMs / (1000 * 60 * 60);

          if (diffHours <= 1) {
            // Tolerância de 1 hora
            procedimentos_no_prazo++;
          } else {
            procedimentos_atrasados++;
            total_atraso += diffHours;
          }
        }

        if (proc.duration) {
          total_duracao += proc.duration;
        }
      });

      const total = procedures.length;
      const dias = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      return {
        procedimentos_no_prazo,
        procedimentos_atrasados,
        taxa_pontualidade: total > 0 ? (procedimentos_no_prazo / total) * 100 : 0,
        tempo_medio_atraso: procedimentos_atrasados > 0 ? total_atraso / procedimentos_atrasados : 0,
        utilizacao_sala: total_duracao / (dias * 24 * 60) * 100, // % de utilização
        procedimentos_por_dia: dias > 0 ? total / dias : 0
      };
    } catch (error) {
      logger.error('[Analytics] Erro ao buscar métricas de eficiência:', error);
      throw error;
    }
  }

  /**
   * Análise detalhada por categoria
   */
  async getCategoryAnalysis(
    category: ProcedureCategory,
    period: string = 'month',
    date: Date = new Date(),
    hospitalId?: string
  ): Promise<CategoryAnalysis> {
    try {
      const hId = hospitalId || this.hospitalId;
      const { startDate, endDate } = this.getPeriodDates(period, date);
      const categoryStr = String(category);

      // Usar raw query para evitar problemas com tipos de enum
      const procedures = await prisma.$queryRaw`
        SELECT 
          "basePrice",
          duration,
          complexity,
          complications
        FROM procedures
        WHERE 
          "hospitalId" = ${hId}
          AND category = ${categoryStr}
          AND "performedDate" >= ${startDate}
          AND "performedDate" <= ${endDate}
          AND "performedDate" IS NOT NULL
      ` as any[];

      const total_procedimentos = procedures.length;
      const valor_total = procedures.reduce((sum, p) => sum + Number(p.basePrice || 0), 0);
      const duracao_total = procedures.reduce((sum, p) => sum + Number(p.duration || 0), 0);
      const procedimentos_complexos = procedures.filter(p => p.complexity === 'HIGH').length;
      const com_complicacoes = procedures.filter(p => p.complications).length;

      return {
        categoria: category,
        total_procedimentos,
        valor_total,
        duracao_total,
        duracao_media: total_procedimentos > 0 ? duracao_total / total_procedimentos : 0,
        procedimentos_complexos,
        taxa_complicacoes: total_procedimentos > 0 ? (com_complicacoes / total_procedimentos) * 100 : 0
      };
    } catch (error) {
      logger.error('[Analytics] Erro ao buscar análise de categoria:', error);
      throw error;
    }
  }

  /**
   * Retorna procedimentos por período com detalhes
   */
  async getProceduresByPeriod(
    period: string = 'day',
    date: Date = new Date(),
    status?: ProcedureStatus,
    hospitalId?: string
  ) {
    try {
      const hId = hospitalId || this.hospitalId;
      const { startDate, endDate } = this.getPeriodDates(period, date);

      const whereClause: any = {
        hospitalId: hId,
        performedDate: {
          gte: startDate,
          lte: endDate
        }
      };

      if (status) {
        whereClause.status = status;
      }

      const procedures = await prisma.procedure.findMany({
        where: whereClause,
        select: {
          id: true,
          code: true,
          name: true,
          category: true,
          status: true,
          performedDate: true,
          duration: true,
          basePrice: true,
          complexity: true,
          patient: {
            select: {
              fullName: true
            }
          }
        },
        orderBy: {
          performedDate: 'desc'
        }
      });

      return procedures;
    } catch (error) {
      logger.error('[Analytics] Erro ao buscar procedimentos por período:', error);
      throw error;
    }
  }

  /**
   * Helper para calcular datas do período
   */
  private getPeriodDates(period: string, date: Date): { startDate: Date; endDate: Date } {
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);

    switch (period) {
      case 'day':
        // Já configurado
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        throw new Error(`Período inválido: ${period}`);
    }

    return { startDate, endDate };
  }
}
