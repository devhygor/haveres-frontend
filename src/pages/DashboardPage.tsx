import { useQuery } from "@tanstack/react-query";
import { Wallet, TrendingUp, TrendingDown, PieChart, Info } from "lucide-react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { portfolioApi } from "@/api/portfolio";
import { PatrimonyEvolutionChart } from "@/components/charts/PatrimonyEvolutionChart";
import { AllocationChart } from "@/components/charts/AllocationChart";
import { CurrencyWidget } from "@/components/cards/CurrencyWidget";
import { MacroWidget } from "@/components/cards/MacroWidget";
import { CryptoWidget } from "@/components/cards/CryptoWidget";
import { LoadingState, SkeletonCard } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { ReferenceTimeHint } from "@/components/common/ReferenceTimeHint";
import { cn } from "@/utils/cn";
import { formatCurrency, formatPercent, plClass } from "@/utils/format";
import { TermTooltip } from "@/components/common/TermTooltip";

function toFinite(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function DashboardPage() {
  const summary = useQuery({
    queryKey: ["portfolio", "summary"],
    queryFn: () => portfolioApi.getSummary().then((r) => r.data),
  });

  const allocationByType = useQuery({
    queryKey: ["portfolio", "allocation", "type"],
    queryFn: () => portfolioApi.getAllocationByType().then((r) => r.data),
  });

  const data = summary.data;

  if (summary.isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <LoadingState />
      </div>
    );
  }

  if (summary.isError) {
    return <ErrorState onRetry={() => summary.refetch()} />;
  }

  if (!data) {
    return <ErrorState message="Não foi possível carregar os dados do dashboard." onRetry={() => summary.refetch()} />;
  }

  const totalValue = toFinite(data.total_value);
  const totalInvested = toFinite(data.total_invested);
  const plAbsolute = toFinite(data.pl_absolute);
  const dividendsTotal = toFinite(data.dividends_total);
  const dividendsTotalGross = toFinite(data.dividends_total_gross);
  const dividendsTotalIr = toFinite(data.dividends_total_ir);
  const plTotal = toFinite(data.pl_total);
  const plTotalPercent = toFinite(data.pl_total_percent);
  const ResultTrendIcon = plAbsolute >= 0 ? TrendingUp : TrendingDown;

  return (
    <div className="space-y-6">
      {/* Cards principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card-haveres p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="inline-flex items-center gap-1.5 text-sm text-muted-foreground font-medium">
              <TermTooltip term="Patrimônio Total" />
              <ReferenceTimeHint
                asOf={data.valuation_reference_at}
                rangeStart={data.valuation_reference_min_at}
                rangeEnd={data.valuation_reference_max_at}
              />
            </div>
            <div className="p-2 rounded-lg bg-secondary/50">
              <Wallet size={16} className="text-haveres-blue" />
            </div>
          </div>

          <p className="text-2xl font-bold text-white font-numeric">{formatCurrency(totalValue)}</p>

          <div className="mt-3 pt-3 border-t border-haveres-border/70">
            <p className="text-xs text-muted-foreground"><TermTooltip term="Valor investido" /></p>
            <p className="text-base font-semibold text-white font-numeric">{formatCurrency(totalInvested)}</p>
          </div>
        </div>

        <div className="card-haveres p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <p className="text-sm text-muted-foreground font-medium">
              <TermTooltip term="Lucro / Prejuízo" />
            </p>
            <div className="p-2 rounded-lg bg-secondary/50">
              <ResultTrendIcon size={16} className={cn(plClass(plAbsolute))} />
            </div>
          </div>

          <p className={cn("text-2xl font-bold font-numeric", plClass(plAbsolute))}>
            {formatCurrency(plAbsolute)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Ganho de capital (sem proventos)</p>

          <div className="mt-3 pt-3 border-t border-haveres-border/70 grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center gap-1">
                <p className="text-xs text-muted-foreground">Proventos recebidos</p>
                <TooltipPrimitive.Root delayDuration={150}>
                  <TooltipPrimitive.Trigger asChild>
                    <span className="cursor-help inline-flex items-center">
                      <Info size={10} className="text-muted-foreground/50" />
                    </span>
                  </TooltipPrimitive.Trigger>
                  <TooltipPrimitive.Portal>
                    <TooltipPrimitive.Content
                      sideOffset={5}
                      className="z-50 max-w-[240px] rounded-lg bg-haveres-card border border-haveres-border px-3 py-2 text-xs text-muted-foreground shadow-xl leading-relaxed"
                    >
                      <p className="font-semibold text-white mb-1.5">Composição dos Proventos</p>
                      <div className="space-y-1">
                        <div className="flex justify-between gap-4">
                          <span>Bruto</span>
                          <span className="text-white font-numeric">{formatCurrency(dividendsTotalGross)}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span>IR retido</span>
                          <span className="text-red-400 font-numeric">-{formatCurrency(dividendsTotalIr)}</span>
                        </div>
                        <div className="flex justify-between gap-4 pt-1 border-t border-haveres-border mt-1">
                          <span className="text-white">Líquido</span>
                          <span className="text-gain font-semibold font-numeric">{formatCurrency(dividendsTotal)}</span>
                        </div>
                      </div>
                      <TooltipPrimitive.Arrow className="fill-haveres-border" />
                    </TooltipPrimitive.Content>
                  </TooltipPrimitive.Portal>
                </TooltipPrimitive.Root>
              </div>
              <p className="text-base font-semibold text-gain font-numeric">{formatCurrency(dividendsTotal)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                <TermTooltip term="Retorno total" />
              </p>
              <p className={cn("text-base font-semibold font-numeric", plClass(plTotal))}>
                {formatCurrency(plTotal)}{" "}
                <span className="text-xs">({formatPercent(plTotalPercent, true)})</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Alocação + Evolução */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card-haveres p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <PieChart size={18} className="text-haveres-blue" />
            <h2 className="text-sm font-semibold text-white">Alocação por Classe</h2>
          </div>
          {allocationByType.isLoading ? (
            <LoadingState />
          ) : allocationByType.data?.length ? (
            <AllocationChart
              data={allocationByType.data}
              labelKey="type_display"
              valueKey="type"
            />
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">Sem dados de alocação</p>
          )}
        </div>

        <div className="card-haveres p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-haveres-blue" />
            <h2 className="text-sm font-semibold text-white">Evolução do Patrimônio</h2>
          </div>
          <PatrimonyEvolutionChart availableTypes={allocationByType.data ?? []} />
        </div>
      </div>

      {/* Câmbio + Indicadores macro + Criptomoedas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <CurrencyWidget />
        <MacroWidget />
        <CryptoWidget />
      </div>
    </div>
  );
}
