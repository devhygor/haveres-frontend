import { useQuery } from "@tanstack/react-query";
import { portfolioApi } from "@/api/portfolio";
import { PositionsTable } from "@/components/tables/PositionsTable";
import { AllocationChart } from "@/components/charts/AllocationChart";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import { formatCurrency, formatPercent, plClass } from "@/utils/format";
import { Briefcase, PieChart } from "lucide-react";
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

  if (summary.isLoading) return <LoadingState />;
  if (summary.isError) return <ErrorState onRetry={() => summary.refetch()} />;

  const data = summary.data!;

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Valor Atual", value: formatCurrency(data.total_value), highlight: true },
          { label: "Total Investido", value: formatCurrency(data.total_invested) },
          { label: "P&L Absoluto", value: formatCurrency(data.pl_absolute), colored: data.pl_absolute },
          { label: "P&L %", value: formatPercent(data.pl_percent, true), colored: data.pl_percent },
        ].map(({ label, value, highlight, colored }) => (
          <div key={label} className="card-haveres p-5">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Posições */}
        <div className="card-haveres lg:col-span-2">
          <div className="flex items-center gap-2 p-5 border-b border-haveres-border">
            <Briefcase size={18} className="text-haveres-blue" />
            <h2 className="text-sm font-semibold text-white">Posições ({data.positions.length})</h2>
          </div>
          {data.positions.length === 0
            ? <EmptyState title="Nenhuma posição" description="Cadastre compras para ver suas posições." />
            : <PositionsTable positions={data.positions} />
          }
        </div>

        {/* Alocação */}
        <div className="card-haveres p-5">
          <div className="flex items-center gap-2 mb-4">
            <PieChart size={18} className="text-haveres-blue" />
            <h2 className="text-sm font-semibold text-white">Alocação</h2>
          </div>
          {allocation.data?.length
            ? <AllocationChart data={allocation.data} labelKey="type_display" />
            : <EmptyState title="Sem dados" />
          }
        </div>
      </div>
    </div>
  );
}
