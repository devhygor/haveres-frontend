import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { HelpCircle } from "lucide-react";
import { cn } from "@/utils/cn";

export const GLOSSARY: Record<string, string> = {
  "P/L": "Preço/Lucro: indica quantos anos levaria para o lucro da empresa recuperar o preço pago pela ação. P/L baixo pode indicar ação barata; muito alto pode refletir expectativa exagerada de crescimento.",
  "P/VP": "Preço/Valor Patrimonial: compara o preço de mercado com o valor contábil por ação. P/VP abaixo de 1 pode indicar que a ação está sendo negociada abaixo do valor dos ativos da empresa.",
  "LPA": "Lucro Por Ação: lucro líquido da empresa dividido pelo número total de ações. Indica quanto cada ação gerou de lucro no período.",
  "EPS": "Earnings Per Share (Lucro Por Ação): mesma métrica que LPA, porém na nomenclatura internacional.",
  "Market Cap": "Capitalização de Mercado: valor total da empresa em bolsa (preço × total de ações). Small Cap < R$2bi · Mid Cap R$2–10bi · Large Cap > R$10bi.",
  "Máx 52 semanas": "Maior preço de fechamento negociado nos últimos 12 meses. Referência para avaliar se o ativo está perto de sua máxima histórica recente.",
  "Mín 52 semanas": "Menor preço de fechamento negociado nos últimos 12 meses. Referência para avaliar se o ativo está perto de sua mínima histórica recente.",
  "CDI": "Certificado de Depósito Interbancário: taxa de juros das operações entre bancos, muito próxima à Selic. Principal benchmark da renda fixa — investimentos 'pós-fixados' geralmente rendem um percentual do CDI.",
  "Selic": "Taxa básica de juros da economia brasileira, definida pelo Comitê de Política Monetária (COPOM) do Banco Central. Influencia diretamente o custo do crédito e a rentabilidade da renda fixa.",
  "IPCA": "Índice Nacional de Preços ao Consumidor Amplo: principal indicador de inflação do Brasil, medido mensalmente pelo IBGE. Mede a variação de preços de produtos e serviços consumidos pelas famílias.",
  "IGP-M": "Índice Geral de Preços do Mercado: índice de inflação calculado pela FGV. Muito usado em reajustes de contratos de aluguel. Costuma ser mais volátil que o IPCA.",
  "Selic Overnight": "Taxa Selic diária efetiva das operações compromissadas de um dia com títulos públicos. Referência de curtíssimo prazo para o custo do dinheiro.",
  "INPC": "Índice Nacional de Preços ao Consumidor: mede a inflação para famílias de menor renda e é usado em reajustes salariais e benefícios.",
  "Taxa Referencial": "Taxa de juros de referência usada historicamente em contratos e na poupança. Atualmente costuma ficar próxima de zero na maior parte do tempo.",
  "IBC-Br": "Índice de Atividade Econômica do Banco Central. Funciona como uma prévia mensal do desempenho da economia brasileira.",
  "PIB Mensal": "Estimativa mensal da variação da atividade econômica, usada para acompanhar tendências do PIB entre divulgações trimestrais.",
  "Desemprego": "Taxa de desocupação da população economicamente ativa. Indica o percentual de pessoas sem trabalho que estão procurando emprego.",
  "Poupança": "Rendimento da caderneta de poupança no período. Útil como referência mínima de retorno para investimentos conservadores.",
  "USD PTAX": "Taxa de câmbio de referência do dólar (PTAX), calculada pelo Banco Central. Muito usada para marcação e contratos financeiros.",
  "EUR PTAX": "Taxa de câmbio de referência do euro (PTAX), calculada pelo Banco Central.",
  "Indicadores": "Principais variáveis macroeconômicas e de mercado que ajudam a contextualizar juros, inflação, atividade e câmbio.",
  "Índices de Mercado": "Indicadores de desempenho de cestas de ativos na bolsa, usados como referência para comparar a performance da carteira.",
  "IBOV": "Índice Ibovespa: principal índice da bolsa brasileira, composto pelas ações mais negociadas da B3.",
  "IFIX": "Índice de Fundos Imobiliários da B3, que acompanha o desempenho médio dos FIIs mais negociados.",
  "SMLL": "Índice Small Cap da B3, formado por ações de empresas de menor capitalização de mercado.",
  "IDIV": "Índice de Dividendos da B3, composto por empresas com histórico relevante de distribuição de proventos.",
  "IVVB11": "ETF negociado na B3 que busca replicar o S&P 500 em reais, incluindo efeito de variação cambial.",
  "Rentabilidade Comparada": "Compara a rentabilidade da carteira com benchmarks de mercado no período selecionado.",
  "PM": "Preço Médio de aquisição: custo médio ponderado de todas as compras, incluindo taxas. Serve de referência para calcular lucro ou prejuízo da posição.",
  "Preço Médio": "Custo médio ponderado de todas as compras realizadas, incluindo taxas de corretagem. Serve de referência para calcular lucro ou prejuízo da posição.",
  "P&L": "Profit & Loss (Lucro e Prejuízo): diferença entre o valor atual da posição e o total investido. Positivo = lucro não realizado; negativo = prejuízo não realizado.",
  "Alocação": "Percentual do patrimônio total da carteira investido neste ativo. Indica o grau de concentração da carteira nessa posição.",
  "Meta de Alocação": "Percentual alvo que você deseja para cada ativo dentro da carteira. A soma das metas deve totalizar 100% para orientar aportes e rebalanceamento.",
  "Desvio da Meta": "Diferença entre a alocação atual e a meta definida para o ativo. Valor positivo indica quanto falta aportar; valor negativo indica excesso em relação à meta.",
  "Preço Máximo de Compra": "Preço limite que você aceita pagar para fazer novos aportes no ativo. Se a cotação atual estiver acima desse valor, o ativo fica fora do seu preço de entrada planejado.",
  "Janela de Compra": "Compara a cotação atual com o preço máximo de compra definido. Valor positivo indica espaço para compra; valor negativo indica que a cotação está acima do limite.",
  "Investido": "Total de capital efetivamente aportado neste ativo, calculado como quantidade × preço médio de compra.",
  "DY": "Dividend Yield: total de dividendos/rendimentos pagos no período dividido pelo preço atual. Indica o retorno em proventos em relação ao preço de mercado.",
  "JCP": "Juros Sobre Capital Próprio: forma de distribuição de lucros usada por empresas. Diferente do dividendo, tem retenção de Imposto de Renda de 15% na fonte para o investidor.",
  "FII": "Fundo de Investimento Imobiliário: investe em imóveis ou títulos imobiliários e é obrigado a distribuir pelo menos 95% do lucro aos cotistas — geralmente de forma mensal.",
  "ETF": "Exchange Traded Fund: fundo de índice negociado em bolsa que replica uma carteira (ex: BOVA11 = Ibovespa). Combina diversificação com baixo custo e liquidez de ação.",
  "BDR": "Brazilian Depositary Receipt: certificado negociado na B3 que representa ações de empresas estrangeiras (ex: AAPL34 = Apple). Permite investir em empresas internacionais sem conta no exterior.",
  "Ganho Realizado": "Lucro ou prejuízo já efetivado por meio de vendas. Difere do ganho não realizado, que ainda está em aberto na carteira e pode mudar com as variações de preço.",
  "Proventos": "Rendimentos pagos por ativos financeiros: dividendos (ações), rendimentos (FIIs), JCP e amortizações. Representam a remuneração periódica do investimento.",
  "P&L Absoluto": "Lucro ou prejuízo em reais: diferença entre o valor atual da carteira e o total investido. Positivo = lucro; negativo = prejuízo.",
  "P&L %": "Variação percentual da carteira: (valor atual − total investido) ÷ total investido × 100. Indica o retorno relativo sobre o capital aplicado.",
  "Patrimônio Total": "Valor de mercado atual da carteira: soma do valor atual de todas as posições abertas.",
  "Valor investido": "Total de capital aportado nas posições atuais da carteira. Não inclui posições já zeradas.",
  "Lucro / Prejuízo": "Diferença entre o valor atual da carteira e o total investido. Positivo = lucro não realizado; negativo = prejuízo não realizado.",
  "Ganho de Capital": "Parcela do resultado que vem da variação de preço dos ativos: valor atual menos valor investido.",
  "Dividendos Recebidos": "Soma dos proventos efetivamente recebidos (pagos) no período considerado.",
  "Dividendos/Proventos Recebidos": "Totais de dividendos e demais proventos efetivamente recebidos em janelas de tempo da carteira.",
  "Proventos Recebidos (Ano)": "Total de proventos recebidos no ano corrente (de janeiro até hoje).",
  "Dividendos/Proventos Recebidos (Ano)": "Total de dividendos e demais proventos recebidos no ano corrente (de janeiro até hoje).",
  "Últimos 12m": "Total de dividendos e proventos recebidos nos últimos 12 meses móveis (data atual menos 12 meses até hoje).",
  "Proventos no mês": "Total de proventos recebidos no mês corrente (do primeiro dia do mês até hoje).",
  "A receber": "Proventos já anunciados com pagamento futuro. Ainda não foram creditados na conta.",
  "Variação": "Retorno não realizado da carteira em percentual e em valor absoluto, com base no capital investido.",
  "Rentabilidade": "Retorno total da carteira considerando ganho de capital + proventos recebidos, dividido pelo total investido.",
  "Variação e Rentabilidade": "Comparativo entre retorno não realizado (variação) e retorno total acumulado (rentabilidade).",
  "Total Investido": "Soma de todos os aportes realizados na carteira, calculado como preço médio × quantidade para cada posição.",
  "Cotação": "Preço atual de mercado do ativo, atualizado periodicamente pelo provedor de dados (com possível atraso de alguns minutos).",
  "Data com": "Data limite para ter direito ao provento. Quem possuir o ativo até esta data receberá o dividendo ou rendimento na data de pagamento.",
  "IR": "Imposto de Renda retido na fonte. Dividendos de ações brasileiras são isentos (IR = 0). JCP tem retenção de 15%. Rendimentos de FII são isentos para pessoa física.",
  "Bruto": "Valor total do provento antes da dedução de impostos.",
  "Líquido": "Valor efetivamente recebido após dedução do IR retido na fonte.",
  "Pgto": "Data de pagamento: quando o valor do provento será creditado na conta do investidor pela corretora.",
  "Dividendo": "Distribuição de parte do lucro da empresa aos acionistas. No Brasil, dividendos são isentos de IR para pessoa física.",
  "Rendimento FII": "Distribuição mensal dos aluguéis e rendimentos de um Fundo de Investimento Imobiliário. Isento de IR para pessoa física que possua menos de 10% das cotas.",
};

interface Props {
  term: string;
  children?: React.ReactNode;
  className?: string;
}

export function TermTooltip({ term, children, className }: Props) {
  const content = GLOSSARY[term];
  const label = children ?? term;

  if (!content) return <span className={className}>{label}</span>;

  return (
    <TooltipPrimitive.Root delayDuration={150}>
      <TooltipPrimitive.Trigger asChild>
        <span
          className={cn(
            "cursor-help inline-flex items-center gap-0.5",
            className
          )}
        >
          {label}
          <HelpCircle size={10} className="text-muted-foreground/50 flex-shrink-0 mb-px" />
        </span>
      </TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          sideOffset={5}
          className="z-50 max-w-[280px] rounded-lg bg-haveres-card border border-haveres-border px-3 py-2 text-xs text-muted-foreground shadow-xl leading-relaxed"
        >
          {content}
          <TooltipPrimitive.Arrow className="fill-haveres-border" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
