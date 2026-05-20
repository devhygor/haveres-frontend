import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { portfolioApi } from "@/api/portfolio";
import { PositionsTable } from "@/components/tables/PositionsTable";
import { AllocationChart } from "@/components/charts/AllocationChart";
import { BenchmarkChart } from "@/components/charts/BenchmarkChart";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import { ReferenceTimeHint } from "@/components/common/ReferenceTimeHint";
import { formatCurrency, formatPercent, plClass } from "@/utils/format";
import { Briefcase, PieChart, Wallet, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/utils/cn";
import { TermTooltip } from "@/components/common/TermTooltip";

function toFinite(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

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

  const positions = Array.isArray(summary.data?.positions) ? summary.data!.positions : [];

  const selectedTypeLabel = useMemo(() => {
    if (!selectedType || !allocation.data) return null;
    const item = allocation.data.find((entry) => entry.type === selectedType);
    return item?.type_display || selectedType;
  }, [allocation.data, selectedType]);

  const filteredSectorData = useMemo(() => {
    const sectorDisplayMap = new Map(
      (allocationBySector.data ?? []).map((item) => [item.sector, item.sector_display]),
    );
    if (!selectedType) return allocationBySector.data ?? [];
    const typePositions = positions.filter((p) => p.asset_type === selectedType);
    if (!typePositions.length) return [];
    const total = typePositions.reduce((sum, p) => sum + Number(p.current_value), 0);
    if (total === 0) return [];
    const bySector = new Map<string, number>();
    for (const p of typePositions) {
      bySector.set(p.sector, (bySector.get(p.sector) ?? 0) + Number(p.current_value));
    }
    return Array.from(bySector.entries())
      .map(([sector, value]) => ({
        sector,
        sector_display: sectorDisplayMap.get(sector) ?? sector,
        value,
        allocation: (value / total) * 100,
      }))
      .sort((a, b) => b.value - a.value);
  }, [selectedType, positions, allocationBySector.data]);

  const selectedSectorLabel = useMemo(() => {
    if (!selectedSector) return null;
    const item = filteredSectorData.find((entry) => entry.sector === selectedSector);
    return item?.sector_display || selectedSector;
  }, [filteredSectorData, selectedSector]);

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
    setSelectedSector(null);
  }, [selectedType]);

  useEffect(() => {
    if (!selectedSector) return;
    if (!filteredSectorData.some((entry) => entry.sector === selectedSector)) {
      setSelectedSector(null);
    }
  }, [filteredSectorData, selectedSector]);

  const hasActiveFilters = Boolean(selectedType || selectedSector);

  if (summary.isLoading) return <LoadingState />;
  if (summary.isError) return <ErrorState onRetry={() => summary.refetch()} />;
  if (!summary.data) return <ErrorState message="Não foi possível carregar os dados da carteira." onRetry={() => summary.refetch()} />;

  const data = summary.data;
  const totalValue = toFinite(data.total_value);
  const totalInvested = toFinite(data.total_invested);
  const plAbsolute = toFinite(data.pl_absolute);
  const plPercent = toFinite(data.pl_percent);
  const dividendsYear = toFinite(data.dividends_year);
  const positionsCount = Math.max(0, Math.trunc(toFinite(data.positions_count)));
  const totalResult = plAbsolute + dividendsYear;
  const totalReturnPercent = totalInvested > 0
    ? (totalResult / totalInvested) * 100
    : 0;
  const ResultTrendIcon = plAbsolute >= 0 ? TrendingUp : TrendingDown;
  const ReturnTrendIcon = totalReturnPercent >= 0 ? TrendingUp : TrendingDown;

  const clearFilters = () => {
    setSelectedType(null);
    setSelectedSector(null);
  };

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
        </div>

        <div className="card-haveres p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <p className="text-sm text-muted-foreground font-medium"><TermTooltip term="Variação e Rentabilidade" /></p>
            <div className="p-2 rounded-lg bg-secondary/50">
              <ReturnTrendIcon size={16} className={cn(plClass(totalReturnPercent))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground"><TermTooltip term="Variação" /></p>
              <p className={cn("text-2xl font-bold font-numeric", plClass(plPercent))}>
                {formatPercent(plPercent, true)}
              </p>
              <p className={cn("text-sm font-medium font-numeric", plClass(plAbsolute))}>
                {formatCurrency(plAbsolute)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground"><TermTooltip term="Rentabilidade" /></p>
              <p className={cn("text-2xl font-bold font-numeric", plClass(totalReturnPercent))}>
                {formatPercent(totalReturnPercent, true)}
              </p>
              <p className={cn("text-sm font-medium font-numeric", plClass(totalResult))}>
                {formatCurrency(totalResult)}
              </p>
            </div>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            {positionsCount} posições
          </p>
        </div>
      </div>

      {/* Rentabilidade Comparada */}
      <div className="card-haveres p-4 sm:p-5">
        <BenchmarkChart />
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
            <h2 className="text-sm font-semibold text-white">
              Alocação por Setor
              {selectedTypeLabel && (
                <span className="ml-2 text-xs font-normal text-haveres-blue">— {selectedTypeLabel}</span>
              )}
            </h2>
          </div>
          {allocationBySector.isLoading ? (
            <LoadingState />
          ) : filteredSectorData.length ? (
            <AllocationChart
              data={filteredSectorData}
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
