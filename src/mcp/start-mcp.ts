#!/usr/bin/env node
/**
 * Script para iniciar o MCP Server do ms-procedures
 * Uso: npm run mcp
 */

import { ProceduresMCPServer } from './server';
import { logger } from '../config/logger';
import { connectDatabase } from '../config/database';

async function main() {
  try {
    logger.info('[MCP] Iniciando MCP Server do ms-procedures...');

    // Conectar ao banco de dados
    await connectDatabase();
    logger.info('[MCP] Banco de dados conectado');

    // Iniciar servidor MCP
    const server = new ProceduresMCPServer();
    await server.run();

    logger.info('[MCP] Servidor MCP rodando e aguardando conexões');
  } catch (error) {
    logger.error('[MCP] Erro fatal ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Tratamento de sinais
process.on('SIGINT', () => {
  logger.info('[MCP] Recebido SIGINT, encerrando...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('[MCP] Recebido SIGTERM, encerrando...');
  process.exit(0);
});

main();
