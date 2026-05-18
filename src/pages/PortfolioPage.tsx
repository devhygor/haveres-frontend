import { useEffect, useMemo, useState } from "react";
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
import { TermTooltip } from "@/components/common/TermTooltip";

export function PortfolioPage() {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedSector, setSelectedSector] = useState<string | null>(null);

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

  const positions = Array.isArray(summary.data?.positions) ? summary.data!.positions : [];

  const selectedTypeLabel = useMemo(() => {
    if (!selectedType || !allocation.data) return null;
    const item = allocation.data.find((entry) => entry.type === selectedType);
    return item?.type_display || selectedType;
  }, [allocation.data, selectedType]);

  const selectedSectorLabel = useMemo(() => {
    if (!selectedSector || !allocationBySector.data) return null;
    const item = allocationBySector.data.find((entry) => entry.sector === selectedSector);
    return item?.sector_display || selectedSector;
  }, [allocationBySector.data, selectedSector]);

  const filteredPositions = useMemo(() => {
    return positions.filter((position) => {
      const typeMatches = !selectedType || position.asset_type === selectedType;
      const sectorMatches = !selectedSector || position.sector === selectedSector;
      return typeMatches && sectorMatches;
    });
  }, [positions, selectedSector, selectedType]);

  useEffect(() => {
    if (!selectedType) return;
    if (!allocation.data?.some((entry) => entry.type === selectedType)) {
      setSelectedType(null);
    }
  }, [allocation.data, selectedType]);

  useEffect(() => {
    if (!selectedSector) return;
    if (!allocationBySector.data?.some((entry) => entry.sector === selectedSector)) {
      setSelectedSector(null);
    }
  }, [allocationBySector.data, selectedSector]);

  const hasActiveFilters = Boolean(selectedType || selectedSector);

  if (summary.isLoading) return <LoadingState />;
  if (summary.isError) return <ErrorState onRetry={() => summary.refetch()} />;
  if (!summary.data) return <ErrorState message="Não foi possível carregar os dados da carteira." onRetry={() => summary.refetch()} />;

  const data = summary.data;

  const clearFilters = () => {
    setSelectedType(null);
    setSelectedSector(null);
  };

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Valor Atual", value: formatCurrency(data.total_value), highlight: true },
          { label: "Total Investido", value: formatCurrency(data.total_invested) },
          { label: <TermTooltip term="P&L Absoluto" />, key: "P&L Absoluto", value: formatCurrency(data.pl_absolute), colored: data.pl_absolute },
          { label: <TermTooltip term="P&L %" />, key: "P&L %", value: formatPercent(data.pl_percent, true), colored: data.pl_percent },
        ].map(({ label, key, value, highlight, colored }) => (
          <div key={key ?? String(label)} className="card-haveres p-4 sm:p-5">
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
        ) : patrimonyEvolution.isError ? (
          <ErrorState onRetry={() => patrimonyEvolution.refetch()} />
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
            ? (
              <AllocationChart
                data={allocation.data}
                labelKey="type_display"
                valueKey="type"
                selectedValue={selectedType}
                onSelectValue={setSelectedType}
              />
            )
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
            <AllocationChart
              data={allocationBySector.data}
              labelKey="sector_display"
              valueKey="sector"
              selectedValue={selectedSector}
              onSelectValue={setSelectedSector}
            />
          ) : (
            <EmptyState title="Sem dados de setor" />
          )}
        </div>
      </div>

      {/* Posições */}
      <div className="card-haveres">
        <div className="flex flex-wrap items-center gap-2 p-4 sm:p-5 border-b border-haveres-border">
          <Briefcase size={18} className="text-haveres-blue" />
          <h2 className="text-sm font-semibold text-white">Posições ({filteredPositions.length})</h2>
          {hasActiveFilters && (
            <>
              <span className="text-xs text-muted-foreground">de {positions.length} ativos</span>
              {selectedTypeLabel && (
                <span className="text-xs px-2 py-0.5 rounded bg-secondary text-muted-foreground">
                  Classe: {selectedTypeLabel}
                </span>
              )}
              {selectedSectorLabel && (
                <span className="text-xs px-2 py-0.5 rounded bg-secondary text-muted-foreground">
                  Setor: {selectedSectorLabel}
                </span>
              )}
              <button
                type="button"
                onClick={clearFilters}
                className="sm:ml-auto text-xs px-2 py-1 rounded bg-secondary text-muted-foreground hover:text-white transition-colors"
              >
                Limpar filtros
              </button>
            </>
          )}
        </div>
        {positions.length === 0 ? (
          <EmptyState title="Nenhuma posição" description="Cadastre compras para ver suas posições." />
        ) : filteredPositions.length === 0 ? (
          <EmptyState
            title="Nenhuma posição para este filtro"
            description="Tente selecionar outra fatia do gráfico ou limpar os filtros aplicados."
            action={(
              <button
                type="button"
                onClick={clearFilters}
                className="px-4 py-2 bg-secondary text-muted-foreground text-sm font-medium rounded-lg hover:text-white transition-colors"
              >
                Limpar filtros
              </button>
            )}
          />
        ) : (
          <PositionsTable positions={filteredPositions} />
        )
        }
      </div>
    </div>
  );
}
