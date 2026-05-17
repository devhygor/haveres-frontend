import { useQuery } from "@tanstack/react-query";
import { portfolioApi } from "@/api/portfolio";
import { PositionsTable } from "@/components/tables/PositionsTable";
import { AllocationChart } from "@/components/charts/AllocationChart";
import { PatrimonyChart } from "@/components/charts/PatrimonyChart";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import { formatCurrency, formatPercent, plClass } from "@/utils/format";
import { Briefcase, PieChart, BarChart3 } from "lucide-react";
import { cn } from "@/utils/cn";

export function PortfolioPage() {
  const summary = useQuery({
    queryKey: ["portfolio", "summary"],
    queryFn: () => portfolioApi.getSummary().then((r) => r.data),
  });
  const allocation = useQuery({
    queryKey: ["portfolio", "allocation", "type"],
    queryFn: () => portfolioApi.getAllocationByType().then((r) => r.data),
  });
  const allocationBySector = useQuery({
    queryKey: ["portfolio", "allocation", "sector"],
    queryFn: () => portfolioApi.getAllocationBySector().then((r) => r.data),
  });
  const patrimonyEvolution = useQuery({
    queryKey: ["portfolio", "evolution", "patrimony"],
    queryFn: () => portfolioApi.getPatrimonyEvolution(12).then((r) => r.data),
  });

  if (summary.isLoading) return <LoadingState />;
  if (summary.isError) return <ErrorState onRetry={() => summary.refetch()} />;

  const data = summary.data!;

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Valor Atual", value: formatCurrency(data.total_value), highlight: true },
          { label: "Total Investido", value: formatCurrency(data.total_invested) },
          { label: "P&L Absoluto", value: formatCurrency(data.pl_absolute), colored: data.pl_absolute },
          { label: "P&L %", value: formatPercent(data.pl_percent, true), colored: data.pl_percent },
        ].map(({ label, value, highlight, colored }) => (
          <div key={label} className="card-haveres p-4 sm:p-5">
            <p className="text-xs text-muted-foreground mb-2">{label}</p>
            <p className={cn(
              "text-xl font-bold font-numeric",
              highlight ? "text-white" : colored !== undefined ? plClass(colored) : "text-white"
            )}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Evolução Patrimonial */}
      <div className="card-haveres p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={18} className="text-haveres-blue" />
          <h2 className="text-sm font-semibold text-white">Evolução Patrimonial (12 meses)</h2>
        </div>
        {patrimonyEvolution.isLoading ? (
          <LoadingState />
        ) : patrimonyEvolution.data?.length ? (
          <PatrimonyChart data={patrimonyEvolution.data} />
        ) : (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Sem histórico. Os dados aparecerão após o primeiro snapshot diário.
          </p>
        )}
      </div>

      {/* Alocação por Classe + por Setor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card-haveres p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <PieChart size={18} className="text-haveres-blue" />
            <h2 className="text-sm font-semibold text-white">Alocação por Classe</h2>
          </div>
          {allocation.data?.length
            ? <AllocationChart data={allocation.data} labelKey="type_display" />
            : <EmptyState title="Sem dados" />
          }
        </div>

        <div className="card-haveres p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <PieChart size={18} className="text-haveres-blue" />
            <h2 className="text-sm font-semibold text-white">Alocação por Setor</h2>
          </div>
          {allocationBySector.isLoading ? (
            <LoadingState />
          ) : allocationBySector.data?.length ? (
            <AllocationChart data={allocationBySector.data} labelKey="sector_display" />
          ) : (
            <EmptyState title="Sem dados de setor" />
          )}
        </div>
      </div>

      {/* Posições */}
      <div className="card-haveres">
        <div className="flex items-center gap-2 p-4 sm:p-5 border-b border-haveres-border">
          <Briefcase size={18} className="text-haveres-blue" />
          <h2 className="text-sm font-semibold text-white">Posições ({data.positions.length})</h2>
        </div>
        {data.positions.length === 0
          ? <EmptyState title="Nenhuma posição" description="Cadastre compras para ver suas posições." />
          : <PositionsTable positions={data.positions} />
        }
      </div>
    </div>
  );
}
