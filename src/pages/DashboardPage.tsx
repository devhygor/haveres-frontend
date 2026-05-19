import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Wallet, TrendingUp, CalendarDays, BarChart3, PieChart, Activity } from "lucide-react";
import { portfolioApi } from "@/api/portfolio";
import { quotesApi } from "@/api/quotes";
import { StatCard, PLCard } from "@/components/cards/StatCard";
import { PatrimonyChart } from "@/components/charts/PatrimonyChart";
import { DividendsChart } from "@/components/charts/DividendsChart";
import { AllocationChart } from "@/components/charts/AllocationChart";
import { BenchmarkChart } from "@/components/charts/BenchmarkChart";
import { PositionsTable } from "@/components/tables/PositionsTable";
import { CurrencyWidget } from "@/components/cards/CurrencyWidget";
import { MacroWidget } from "@/components/cards/MacroWidget";
import { CryptoWidget } from "@/components/cards/CryptoWidget";
import { LoadingState, SkeletonCard } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { ReferenceTimeHint } from "@/components/common/ReferenceTimeHint";
import { formatCurrency } from "@/utils/format";
import { TermTooltip } from "@/components/common/TermTooltip";

export function DashboardPage() {
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const summary = useQuery({
    queryKey: ["portfolio", "summary"],
    queryFn: () => portfolioApi.getSummary().then((r) => r.data),
  });

  const allocationByType = useQuery({
    queryKey: ["portfolio", "allocation", "type"],
    queryFn: () => portfolioApi.getAllocationByType().then((r) => r.data),
  });

  const patrimonyEvolution = useQuery({
    queryKey: ["portfolio", "evolution", "patrimony"],
    queryFn: () => portfolioApi.getPatrimonyEvolution(12).then((r) => r.data),
  });

  const dividendsEvolution = useQuery({
    queryKey: ["portfolio", "evolution", "dividends"],
    queryFn: () => portfolioApi.getDividendsEvolution(12).then((r) => r.data),
  });

  const benchmark = useQuery({
    queryKey: ["quotes", "benchmark"],
    queryFn: () => quotesApi.getBenchmark(12).then((r) => r.data),
  });

  const upcomingDividends = useQuery({
    queryKey: ["portfolio", "upcoming-dividends"],
    queryFn: () => portfolioApi.getUpcomingDividends().then((r) => r.data),
    staleTime: 1000 * 60 * 5,
  });

  const data = summary.data;

  const positions = useMemo(() => {
    return Array.isArray(data?.positions) ? data.positions : [];
  }, [data?.positions]);

  const selectedTypeLabel = useMemo(() => {
    if (!selectedType || !allocationByType.data) return null;
    const item = allocationByType.data.find((entry) => entry.type === selectedType);
    return item?.type_display || selectedType;
  }, [allocationByType.data, selectedType]);

  const upcomingTotal = useMemo(() => {
    return (upcomingDividends.data ?? []).reduce((s, d) => s + Number(d.expected_amount), 0);
  }, [upcomingDividends.data]);

  const dividendChartData = useMemo(() => {
    const historical = (dividendsEvolution.data ?? []).map((d) => ({
      month: d.month,
      paid: Number(d.total),
      upcoming: 0,
    }));
    const projected = upcomingDividends.data ?? [];
    const byMonth: Record<string, number> = {};
    projected.forEach((d) => {
      if (!d.expected_date) return;
      const key = d.expected_date.slice(0, 7) + "-01";
      byMonth[key] = (byMonth[key] ?? 0) + Number(d.expected_amount);
    });
    const existingMonths = new Set(historical.map((h) => h.month));
    const projectedPoints = Object.entries(byMonth)
      .filter(([m]) => !existingMonths.has(m))
      .map(([month, upcoming]) => ({ month, paid: 0, upcoming }));
    return [...historical, ...projectedPoints].sort((a, b) => a.month.localeCompare(b.month));
  }, [dividendsEvolution.data, upcomingDividends.data]);

  const filteredPositions = useMemo(() => {
    if (!selectedType) return positions;
    return positions.filter((position) => position.asset_type === selectedType);
  }, [positions, selectedType]);

  useEffect(() => {
    if (!selectedType) return;
    if (!allocationByType.data?.some((entry) => entry.type === selectedType)) {
      setSelectedType(null);
    }
  }, [allocationByType.data, selectedType]);

  const clearTypeFilter = () => {
    setSelectedType(null);
  };

  const hasActiveTypeFilter = Boolean(selectedType);

  if (summary.isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
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

  return (
    <div className="space-y-6">
      {/* Cards principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title={(
            <span className="inline-flex items-center gap-1.5">
              Patrimônio Total
              <ReferenceTimeHint
                asOf={data.valuation_reference_at}
                rangeStart={data.valuation_reference_min_at}
                rangeEnd={data.valuation_reference_max_at}
              />
            </span>
          )}
          value={formatCurrency(data.total_value)}
          icon={Wallet}
          iconColor="text-haveres-blue"
          subtitle={`${data.positions_count} posições`}
          className="sm:col-span-2 lg:col-span-1"
        />
        <PLCard
          title={<TermTooltip term="Lucro / Prejuízo" />}
          absolute={data.pl_absolute}
          percent={data.pl_percent}
        />
        <StatCard
          title="Proventos no Mês"
          value={formatCurrency(data.dividends_month)}
          icon={CalendarDays}
          iconColor="text-gain"
        />
        <StatCard
          title="Proventos no Ano"
          value={formatCurrency(data.dividends_year)}
          icon={TrendingUp}
          iconColor="text-gain"
        />
        <StatCard
          title="A Receber"
          value={formatCurrency(upcomingTotal)}
          icon={CalendarDays}
          iconColor="text-haveres-blue"
          subtitle={upcomingDividends.data ? `${upcomingDividends.data.length} proventos` : "—"}
        />
      </div>

      {/* Evolução patrimonial */}
      <div className="card-haveres p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={18} className="text-haveres-blue" />
          <h2 className="text-sm font-semibold text-white">Evolução Patrimonial</h2>
        </div>
        {patrimonyEvolution.isLoading ? (
          <LoadingState />
        ) : patrimonyEvolution.isError ? (
          <ErrorState onRetry={() => patrimonyEvolution.refetch()} />
        ) : patrimonyEvolution.data && patrimonyEvolution.data.length > 0 ? (
          <PatrimonyChart data={patrimonyEvolution.data} />
        ) : (
          <div className="h-64 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Sem histórico ainda. Os dados aparecerão após o primeiro snapshot diário.
            </p>
          </div>
        )}
      </div>

      {/* Alocação + Dividendos */}
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
              selectedValue={selectedType}
              onSelectValue={setSelectedType}
            />
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">Sem dados de alocação</p>
          )}
        </div>

        <div className="card-haveres p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-gain" />
            <h2 className="text-sm font-semibold text-white">Proventos Mensais</h2>
          </div>
          {dividendsEvolution.isLoading ? (
            <LoadingState />
          ) : dividendChartData.length ? (
            <DividendsChart data={dividendChartData} />
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">Sem proventos registrados</p>
          )}
        </div>
      </div>

      {/* Carteira vs CDI */}
      {benchmark.data && benchmark.data.length > 0 && (
        <div className="card-haveres p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={18} className="text-haveres-blue" />
            <h2 className="text-sm font-semibold text-white">Carteira vs CDI (12 meses)</h2>
          </div>
          <BenchmarkChart data={benchmark.data} />
        </div>
      )}

      {/* Posições */}
      <div className="card-haveres">
        <div className="flex flex-wrap items-center gap-2 p-4 sm:p-5 border-b border-haveres-border">
          <Wallet size={18} className="text-haveres-blue" />
          <h2 className="text-sm font-semibold text-white">Posições</h2>
          <span className="text-xs text-muted-foreground">
            {filteredPositions.length} ativos
            {hasActiveTypeFilter ? ` de ${positions.length}` : ""}
          </span>
          {selectedTypeLabel && (
            <span className="text-xs px-2 py-0.5 rounded bg-secondary text-muted-foreground">
              Classe: {selectedTypeLabel}
            </span>
          )}
          {hasActiveTypeFilter && (
            <button
              type="button"
              onClick={clearTypeFilter}
              className="sm:ml-auto text-xs px-2 py-1 rounded bg-secondary text-muted-foreground hover:text-white transition-colors"
            >
              Limpar filtro
            </button>
          )}
        </div>
        {positions.length > 0 ? (
          filteredPositions.length > 0 ? (
            <PositionsTable positions={filteredPositions} />
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Nenhuma posição para o filtro selecionado.
            </p>
          )
        ) : (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Nenhuma posição. Cadastre movimentações para começar.
          </p>
        )}
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
