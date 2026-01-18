import { OpenAI } from 'openai';
import { AnalyticsService } from '../services/analytics.service';

/**
 * Suite Completa de Testes para MCP do ms-procedures
 * Testa todos os casos de uso com OpenAI
 */

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const analyticsService = new AnalyticsService();
const hospitalId = 'hosp_sagrada_familia_001';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  data?: any;
  error?: string;
}

const results: TestResult[] = [];

/**
 * Teste 1: get_top_procedures
 */
async function testTopProcedures() {
  try {
    console.log('\n📋 Testando: get_top_procedures');
    
    const topProcs = await analyticsService.getTopProcedures('month', new Date(), 10, hospitalId);
    
    const passed = Array.isArray(topProcs) && topProcs.length > 0;

    results.push({
      name: 'get_top_procedures',
      passed,
      message: passed 
        ? `${topProcs.length} procedimentos encontrados`
        : 'Nenhum procedimento encontrado',
      data: { count: topProcs.length, samples: topProcs.slice(0, 2) },
    });

    console.log(`   Encontrados: ${topProcs.length} procedimentos`);
    if (topProcs.length > 0) {
      console.log(`   Top 1: ${topProcs[0].name} (${topProcs[0].total_realizados} vezes)`);
    }
  } catch (error: any) {
    results.push({
      name: 'get_top_procedures',
      passed: false,
      message: `Erro ao buscar procedimentos`,
      error: error.message,
    });
    console.error(`   ❌ Erro: ${error.message}`);
  }
}

/**
 * Teste 2: get_procedures_statistics
 */
async function testProceduresStatistics() {
  try {
    console.log('\n📋 Testando: get_procedures_statistics');
    
    const stats = await analyticsService.getProcedureStats('month', new Date(), hospitalId);
    
    const passed = 
      stats.total_procedimentos !== undefined &&
      stats.realizados !== undefined &&
      stats.taxa_realizacao !== undefined;

    results.push({
      name: 'get_procedures_statistics',
      passed,
      message: passed 
        ? `Estatísticas obtidas com sucesso`
        : 'Dados incompletos',
      data: stats,
    });

    console.log(`   Total: ${stats.total_procedimentos}`);
    console.log(`   Realizados: ${stats.realizados}`);
    console.log(`   Agendados: ${stats.agendados}`);
    console.log(`   Cancelados: ${stats.cancelados}`);
    console.log(`   Taxa de realização: ${stats.taxa_realizacao.toFixed(2)}%`);
    console.log(`   Valor total: R$ ${stats.valor_total.toFixed(2)}`);
  } catch (error: any) {
    results.push({
      name: 'get_procedures_statistics',
      passed: false,
      message: `Erro ao buscar estatísticas`,
      error: error.message,
    });
    console.error(`   ❌ Erro: ${error.message}`);
  }
}

/**
 * Teste 3: get_efficiency_metrics
 */
async function testEfficiencyMetrics() {
  try {
    console.log('\n📋 Testando: get_efficiency_metrics');
    
    const efficiency = await analyticsService.getEfficiencyMetrics('month', new Date(), hospitalId);
    
    const passed = 
      efficiency.procedimentos_no_prazo !== undefined &&
      efficiency.taxa_pontualidade !== undefined;

    results.push({
      name: 'get_efficiency_metrics',
      passed,
      message: passed 
        ? `Métricas de eficiência obtidas com sucesso`
        : 'Dados incompletos',
      data: efficiency,
    });

    console.log(`   No prazo: ${efficiency.procedimentos_no_prazo}`);
    console.log(`   Atrasados: ${efficiency.procedimentos_atrasados}`);
    console.log(`   Taxa de pontualidade: ${efficiency.taxa_pontualidade.toFixed(2)}%`);
    console.log(`   Tempo médio de atraso: ${efficiency.tempo_medio_atraso.toFixed(2)} horas`);
    console.log(`   Utilização de sala: ${efficiency.utilizacao_sala.toFixed(2)}%`);
    console.log(`   Procedimentos por dia: ${efficiency.procedimentos_por_dia.toFixed(2)}`);
  } catch (error: any) {
    results.push({
      name: 'get_efficiency_metrics',
      passed: false,
      message: `Erro ao buscar métricas de eficiência`,
      error: error.message,
    });
    console.error(`   ❌ Erro: ${error.message}`);
  }
}

/**
 * Teste 4: get_category_analysis
 */
async function testCategoryAnalysis() {
  try {
    console.log('\n📋 Testando: get_category_analysis');
    
    const analysis = await analyticsService.getCategoryAnalysis(
      'GENERAL_SURGERY',
      'month',
      new Date(),
      hospitalId
    );
    
    const passed = 
      analysis.categoria !== undefined &&
      analysis.total_procedimentos !== undefined;

    results.push({
      name: 'get_category_analysis',
      passed,
      message: passed 
        ? `Análise de categoria obtida com sucesso`
        : 'Dados incompletos',
      data: analysis,
    });

    console.log(`   Categoria: ${analysis.categoria}`);
    console.log(`   Total: ${analysis.total_procedimentos}`);
    console.log(`   Valor total: R$ ${analysis.valor_total.toFixed(2)}`);
    console.log(`   Duração média: ${analysis.duracao_media.toFixed(2)} minutos`);
    console.log(`   Complexos: ${analysis.procedimentos_complexos}`);
    console.log(`   Taxa de complicações: ${analysis.taxa_complicacoes.toFixed(2)}%`);
  } catch (error: any) {
    results.push({
      name: 'get_category_analysis',
      passed: false,
      message: `Erro ao buscar análise de categoria`,
      error: error.message,
    });
    console.error(`   ❌ Erro: ${error.message}`);
  }
}

/**
 * Teste 5: get_procedures_by_period
 */
async function testProceduresByPeriod() {
  try {
    console.log('\n📋 Testando: get_procedures_by_period');
    
    const procedures = await analyticsService.getProceduresByPeriod(
      'month',
      new Date(),
      'COMPLETED',
      hospitalId
    );
    
    const passed = Array.isArray(procedures);

    results.push({
      name: 'get_procedures_by_period',
      passed,
      message: passed 
        ? `${procedures.length} procedimentos encontrados`
        : 'Resposta inválida',
      data: { count: procedures.length, samples: procedures.slice(0, 2) },
    });

    console.log(`   Encontrados: ${procedures.length} procedimentos`);
  } catch (error: any) {
    results.push({
      name: 'get_procedures_by_period',
      passed: false,
      message: `Erro ao buscar procedimentos por período`,
      error: error.message,
    });
    console.error(`   ❌ Erro: ${error.message}`);
  }
}

/**
 * Validação com OpenAI
 */
async function validateWithOpenAI() {
  try {
    console.log('\n\n🤖 Validando resultados com OpenAI...\n');

    const testSummary = results
      .map(
        (r) =>
          `- ${r.name}: ${r.passed ? '✅ PASSOU' : '❌ FALHOU'} - ${r.message}`
      )
      .join('\n');

    const prompt = `
Você é um especialista em QA de APIs. Analise os seguintes resultados de testes do MCP do ms-procedures:

${testSummary}

Dados dos testes (resumo):
${JSON.stringify(results.map(r => ({ 
  name: r.name, 
  passed: r.passed, 
  data: r.data ? {
    count: r.data.count,
    total_procedimentos: r.data.total_procedimentos,
    realizados: r.data.realizados,
    taxa_realizacao: r.data.taxa_realizacao
  } : null
})), null, 2)}

Por favor, forneça:
1. Um resumo geral do status dos testes
2. Quais testes passaram e quais falharam
3. Análise dos dados retornados
4. Recomendações para melhorias
5. Se há algum problema crítico

Seja conciso e direto.
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const analysis = response.choices[0]?.message?.content || '';
    console.log('═'.repeat(80));
    console.log(analysis);
    console.log('═'.repeat(80));
  } catch (error: any) {
    console.error('Erro ao chamar OpenAI:', error.message);
  }
}

/**
 * Executar todos os testes
 */
async function runAllTests() {
  console.log('🧪 SUITE DE TESTES COMPLETA DO MCP ms-procedures');
  console.log('═'.repeat(80));
  console.log(`Hospital: ${hospitalId}`);
  console.log(`Data: ${new Date().toISOString()}`);
  console.log('═'.repeat(80));

  await testTopProcedures();
  await testProceduresStatistics();
  await testEfficiencyMetrics();
  await testCategoryAnalysis();
  await testProceduresByPeriod();

  // Exibir resumo
  console.log('\n\n📊 RESUMO DOS TESTES');
  console.log('═'.repeat(80));

  results.forEach((result) => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.name}`);
    console.log(`   ${result.message}`);
    if (result.error) {
      console.log(`   Erro: ${result.error}`);
    }
  });

  console.log('\n' + '═'.repeat(80));
  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = results.length;
  console.log(
    `📈 Resultado Final: ${passedCount}/${totalCount} testes passaram (${Math.round((passedCount / totalCount) * 100)}%)\n`
  );

  // Validar com OpenAI
  await validateWithOpenAI();
}

// Executar testes
runAllTests().catch(console.error);
