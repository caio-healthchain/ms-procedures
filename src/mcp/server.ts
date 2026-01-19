import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { AnalyticsService } from '../services/analytics.service';
import { logger } from '../config/logger';

const analyticsService = new AnalyticsService();

const TOOLS: Tool[] = [
  {
    name: 'get_top_procedures',
    description: 'Retorna os procedimentos mais realizados no período. Útil para responder "Quais foram os procedimentos mais realizados?"',
    inputSchema: {
      type: 'object',
      properties: {
        period: {
          type: 'string',
          description: 'Período para análise',
          enum: ['day', 'week', 'month', 'quarter', 'year'],
          default: 'month',
        },
        date: {
          type: 'string',
          description: 'Data de referência no formato YYYY-MM-DD',
          format: 'date',
        },
        limit: {
          type: 'number',
          description: 'Número máximo de procedimentos a retornar',
          default: 10,
        },
      },
    },
  },
  {
    name: 'get_procedures_statistics',
    description: 'Retorna estatísticas gerais de procedimentos (total, realizados, taxa de realização, valores, etc.)',
    inputSchema: {
      type: 'object',
      properties: {
        period: {
          type: 'string',
          description: 'Período para análise',
          enum: ['day', 'week', 'month', 'quarter', 'year'],
          default: 'month',
        },
        date: {
          type: 'string',
          description: 'Data de referência no formato YYYY-MM-DD',
          format: 'date',
        },
      },
    },
  },
  {
    name: 'get_efficiency_metrics',
    description: 'Retorna métricas de eficiência operacional (pontualidade, utilização de sala, procedimentos por dia)',
    inputSchema: {
      type: 'object',
      properties: {
        period: {
          type: 'string',
          description: 'Período para análise',
          enum: ['day', 'week', 'month', 'quarter', 'year'],
          default: 'month',
        },
        date: {
          type: 'string',
          description: 'Data de referência no formato YYYY-MM-DD',
          format: 'date',
        },
      },
    },
  },
  {
    name: 'get_category_analysis',
    description: 'Análise detalhada de uma categoria específica de procedimentos',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Categoria do procedimento',
          enum: ['CARDIOLOGY', 'ORTHOPEDICS', 'NEUROLOGY', 'ONCOLOGY', 'GENERAL_SURGERY', 'PEDIATRICS', 'GYNECOLOGY', 'OTHER'],
        },
        period: {
          type: 'string',
          description: 'Período para análise',
          enum: ['day', 'week', 'month', 'quarter', 'year'],
          default: 'month',
        },
        date: {
          type: 'string',
          description: 'Data de referência no formato YYYY-MM-DD',
          format: 'date',
        },
      },
      required: ['category'],
    },
  },
  {
    name: 'get_procedures_by_period',
    description: 'Lista procedimentos realizados em um período específico',
    inputSchema: {
      type: 'object',
      properties: {
        period: {
          type: 'string',
          description: 'Período para análise',
          enum: ['day', 'week', 'month', 'quarter', 'year'],
          default: 'day',
        },
        date: {
          type: 'string',
          description: 'Data de referência no formato YYYY-MM-DD',
          format: 'date',
        },
        status: {
          type: 'string',
          description: 'Filtrar por status',
          enum: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
        },
      },
    },
  },
  {
    name: 'get_procedures_history',
    description: 'Retorna o histórico completo de todos os procedimentos realizados (sem filtro de período). Útil para responder "Quantos procedimentos foram realizados?" ou "Qual é o total de procedimentos?"',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

class ProceduresMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'lazarus-procedures-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      logger.info('[MCP] Listando tools disponíveis');
      return {
        tools: TOOLS,
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      logger.info(`[MCP] Executando tool: ${name}`, { args });

      try {
        switch (name) {
          case 'get_top_procedures':
            return await this.handleGetTopProcedures(args);

          case 'get_procedures_statistics':
            return await this.handleGetStatistics(args);

          case 'get_efficiency_metrics':
            return await this.handleGetEfficiency(args);

          case 'get_category_analysis':
            return await this.handleGetCategoryAnalysis(args);

          case 'get_procedures_by_period':
            return await this.handleGetProceduresByPeriod(args);

          case 'get_procedures_history':
            return await this.handleGetProceduresHistory(args);

          default:
            throw new Error(`Tool desconhecida: ${name}`);
        }
      } catch (error) {
        logger.error(`[MCP] Erro ao executar tool ${name}:`, error);
        return {
          content: [
            {
              type: 'text',
              text: `Erro ao executar ${name}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private async handleGetTopProcedures(args: any) {
    const period = args?.period || 'month';
    const date = args?.date ? new Date(args.date) : new Date();
    const limit = args?.limit || 10;
    const hospitalId = args?.hospitalId || 'hosp_sagrada_familia_001';

    const topProcedures = await analyticsService.getTopProcedures(period, date, limit, hospitalId);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(topProcedures, null, 2),
        },
      ],
    };
  }

  private async handleGetStatistics(args: any) {
    const period = args?.period || 'month';
    const date = args?.date ? new Date(args.date) : new Date();
    const hospitalId = args?.hospitalId || 'hosp_sagrada_familia_001';

    const stats = await analyticsService.getProcedureStats(period, date, hospitalId);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(stats, null, 2),
        },
      ],
    };
  }

  private async handleGetEfficiency(args: any) {
    const period = args?.period || 'month';
    const date = args?.date ? new Date(args.date) : new Date();
    const hospitalId = args?.hospitalId || 'hosp_sagrada_familia_001';

    const efficiency = await analyticsService.getEfficiencyMetrics(period, date, hospitalId);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(efficiency, null, 2),
        },
      ],
    };
  }

  private async handleGetCategoryAnalysis(args: any) {
    if (!args?.category) {
      throw new Error('Parâmetro "category" é obrigatório');
    }

    const period = args.period || 'month';
    const date = args.date ? new Date(args.date) : new Date();
    const hospitalId = args?.hospitalId || 'hosp_sagrada_familia_001';

    const analysis = await analyticsService.getCategoryAnalysis(args.category, period, date, hospitalId);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(analysis, null, 2),
        },
      ],
    };
  }

  private async handleGetProceduresByPeriod(args: any) {
    const period = args?.period || 'day';
    const date = args?.date ? new Date(args.date) : new Date();
    const status = args?.status;
    const hospitalId = args?.hospitalId || 'hosp_sagrada_familia_001';

    const procedures = await analyticsService.getProceduresByPeriod(period, date, status, hospitalId);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(procedures, null, 2),
        },
      ],
    };
  }

  private async handleGetProceduresHistory(args: any) {
    const hospitalId = args?.hospitalId || 'hosp_sagrada_familia_001';

    const history = await analyticsService.getProceduresHistory(hospitalId);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(history, null, 2),
        },
      ],
    };
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    logger.info('[MCP] Servidor MCP iniciado com sucesso');
  }
}

if (require.main === module) {
  const mcpServer = new ProceduresMCPServer();
  mcpServer.run().catch((error) => {
    logger.error('[MCP] Erro ao iniciar servidor:', error);
    process.exit(1);
  });
}

export { ProceduresMCPServer };
