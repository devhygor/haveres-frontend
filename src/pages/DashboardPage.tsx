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
import { LoadingState, SkeletonCard } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { formatCurrency } from "@/utils/format";

export function DashboardPage() {
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

  if (summary.isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <LoadingState />
      </div>
    );
  }

  if (summary.isError) {
    return <ErrorState onRetry={() => summary.refetch()} />;
  }

  const data = summary.data!;

  return (
    <div className="space-y-6">
      {/* Cards principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Patrimônio Total"
          value={formatCurrency(data.total_value)}
          icon={Wallet}
          iconColor="text-haveres-blue"
          subtitle={`${data.positions_count} posições`}
          className="col-span-2 lg:col-span-1"
        />
        <PLCard
          title="Lucro / Prejuízo"
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
      </div>

      {/* Câmbio + Indicadores macro */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <CurrencyWidget />
        <MacroWidget />
      </div>

      {/* Evolução patrimonial */}
      <div className="card-haveres p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={18} className="text-haveres-blue" />
          <h2 className="text-sm font-semibold text-white">Evolução Patrimonial</h2>
        </div>
        {patrimonyEvolution.isLoading ? (
          <LoadingState />
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

      {/* Alocação + Dividendos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card-haveres p-5">
          <div className="flex items-center gap-2 mb-4">
            <PieChart size={18} className="text-haveres-blue" />
            <h2 className="text-sm font-semibold text-white">Alocação por Classe</h2>
          </div>
          {allocationByType.isLoading ? (
            <LoadingState />
          ) : allocationByType.data?.length ? (
            <AllocationChart data={allocationByType.data} labelKey="type_display" />
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">Sem dados de alocação</p>
          )}
        </div>

        <div className="card-haveres p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-gain" />
            <h2 className="text-sm font-semibold text-white">Proventos Mensais</h2>
          </div>
          {dividendsEvolution.isLoading ? (
            <LoadingState />
          ) : dividendsEvolution.data?.length ? (
            <DividendsChart data={dividendsEvolution.data} />
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">Sem proventos registrados</p>
          )}
        </div>
      </div>

      {/* Posições */}
      <div className="card-haveres">
        <div className="flex items-center gap-2 p-5 border-b border-haveres-border">
          <Wallet size={18} className="text-haveres-blue" />
          <h2 className="text-sm font-semibold text-white">Posições</h2>
          <span className="ml-auto text-xs text-muted-foreground">{data.positions.length} ativos</span>
        </div>
        {data.positions.length > 0 ? (
          <PositionsTable positions={data.positions} />
        ) : (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Nenhuma posição. Cadastre movimentações para começar.
          </p>
        )}
      </div>
    </div>
  );
}
