import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { portfolioApi } from "@/api/portfolio";
import { PositionsTable } from "@/components/tables/PositionsTable";
import { AllocationChart } from "@/components/charts/AllocationChart";
import { BenchmarkChart } from "@/components/charts/BenchmarkChart";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import { ReferenceTimeHint } from "@/components/common/ReferenceTimeHint";
import { formatCurrency, formatPercent, plClass } from "@/utils/format";
import { Briefcase, PieChart, Wallet, TrendingUp, TrendingDown, Calculator } from "lucide-react";
import { cn } from "@/utils/cn";
import { TermTooltip } from "@/components/common/TermTooltip";
import type { ContributionSimulationResult } from "@/types/portfolio";

function toFinite(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function sanitizePercentInput(value: string): string {
  const normalized = value
    .replace(/\./g, ",")
    .replace(/\s/g, "")
    .replace(/[^0-9,]/g, "");

  const [integerRaw, ...decimalParts] = normalized.split(",");
  let integerPart = integerRaw.slice(0, 3);
  const decimalPart = decimalParts.join("").slice(0, 2);

  if (normalized.startsWith(",")) {
    integerPart = "0";
  }

  if (!integerPart && !normalized.includes(",")) {
    return "";
  }

  if (!integerPart) {
    return `0,${decimalPart}`;
  }

  const valueAsNumber = Number(`${integerPart}.${decimalPart || "0"}`);
  if (Number.isFinite(valueAsNumber) && valueAsNumber > 100) {
    return "100";
  }

  if (normalized.includes(",")) {
    return `${integerPart},${decimalPart}`;
  }

  return integerPart;
}

function parseLocalePercent(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return 0;

  const normalized = trimmed.replace(",", ".");
  if (!/^\d{1,3}(\.\d{0,2})?$/.test(normalized)) return null;

  const numeric = normalized.endsWith(".") ? normalized.slice(0, -1) : normalized;
  if (!numeric) return 0;

  const parsed = Number(numeric);
  if (!Number.isFinite(parsed)) return null;
  if (parsed < 0 || parsed > 100) return null;
  return parsed;
}

function formatPercentInput(value: number): string {
  if (!Number.isFinite(value)) return "0";
  const normalized = value.toFixed(4).replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
  return normalized.replace(".", ",");
}

function maskMoneyInput(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";

  const amount = Number(digits) / 100;
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function parseMoneyInput(value: string): { value: number | null; valid: boolean } {
  const trimmed = value.trim();
  if (!trimmed) return { value: null, valid: true };

  const normalized = trimmed.replace(/\./g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return { value: null, valid: false };
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return { value: null, valid: false };
  }

  return { value: parsed, valid: true };
}

function formatMoneyInput(value: number | string | null | undefined): string {
  if (value == null) return "";
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "";
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(parsed);
}

function formatSuggestedQuantity(value: unknown): string {
  const quantity = toFinite(value);
  if (Math.abs(quantity - Math.trunc(quantity)) < 0.0001) {
    return String(Math.trunc(quantity));
  }

  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(quantity);
}

function parseApiError(error: unknown, fallback: string): string {
  if (error && typeof error === "object") {
    const maybeError = error as {
      response?: {
        data?: {
          detail?: string;
        } | string;
      };
    };

    const detail = maybeError.response?.data;
    if (typeof detail === "string" && detail) return detail;
    if (detail && typeof detail === "object" && typeof detail.detail === "string" && detail.detail) {
      return detail.detail;
    }
  }

  return fallback;
}

export function PortfolioPage() {
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [targetInputs, setTargetInputs] = useState<Record<string, string>>({});
  const [maxBuyInputs, setMaxBuyInputs] = useState<Record<string, string>>({});
  const [targetError, setTargetError] = useState("");
  const [targetSuccess, setTargetSuccess] = useState("");
  const [maxBuyError, setMaxBuyError] = useState("");
  const [maxBuySuccess, setMaxBuySuccess] = useState("");
  const [contributionInput, setContributionInput] = useState("");
  const [contributionError, setContributionError] = useState("");
  const [contributionResult, setContributionResult] = useState<ContributionSimulationResult | null>(null);

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

  const saveTargetAllocation = useMutation({
    mutationFn: (targets: Array<{ asset_id: string; target_allocation_percent: number }>) =>
      portfolioApi.saveTargetAllocation({ targets }),
    onSuccess: async () => {
      setTargetError("");
      setTargetSuccess("Metas salvas com sucesso.");
      await queryClient.invalidateQueries({ queryKey: ["portfolio", "summary"] });
    },
    onError: (error) => {
      setTargetSuccess("");
      setTargetError(parseApiError(error, "Não foi possível salvar as metas. Tente novamente."));
    },
  });

  const saveMaxBuyPrice = useMutation({
    mutationFn: (items: Array<{ asset_id: string; max_buy_price: number | null }>) =>
      portfolioApi.saveMaxBuyPrice({ items }),
    onSuccess: async (response) => {
      setMaxBuyError("");
      setMaxBuySuccess(
        response.data.configured_count > 0
          ? "Preços máximos salvos com sucesso."
          : "Preços máximos removidos com sucesso.",
      );
      await queryClient.invalidateQueries({ queryKey: ["portfolio", "summary"] });
    },
    onError: (error) => {
      setMaxBuySuccess("");
      setMaxBuyError(parseApiError(error, "Não foi possível salvar os preços máximos. Tente novamente."));
    },
  });

  const simulateContributionPlan = useMutation({
    mutationFn: (amount: number) => portfolioApi.simulateContributionPlan({ amount }),
    onSuccess: (response) => {
      setContributionError("");
      setContributionResult(response.data);
    },
    onError: (error) => {
      setContributionResult(null);
      setContributionError(parseApiError(error, "Não foi possível simular o aporte. Tente novamente."));
    },
  });

  const positions = Array.isArray(summary.data?.positions) ? summary.data.positions : [];
  const totalValue = toFinite(summary.data?.total_value);

  useEffect(() => {
    setTargetInputs((previous) => {
      const next: Record<string, string> = {};
      for (const position of positions) {
        next[position.asset_id] = formatPercentInput(toFinite(position.target_allocation_percent));
      }

      const previousKeys = Object.keys(previous);
      const nextKeys = Object.keys(next);
      const isSame =
        previousKeys.length === nextKeys.length
        && nextKeys.every((key) => previous[key] === next[key]);

      return isSame ? previous : next;
    });
  }, [positions]);

  useEffect(() => {
    setMaxBuyInputs((previous) => {
      const next: Record<string, string> = {};
      for (const position of positions) {
        next[position.asset_id] = formatMoneyInput(position.max_buy_price ?? null);
      }

      const previousKeys = Object.keys(previous);
      const nextKeys = Object.keys(next);
      const isSame =
        previousKeys.length === nextKeys.length
        && nextKeys.every((key) => previous[key] === next[key]);

      return isSame ? previous : next;
    });
  }, [positions]);

  useEffect(() => {
    if (!targetSuccess) return;
    const timeoutId = window.setTimeout(() => setTargetSuccess(""), 2500);
    return () => window.clearTimeout(timeoutId);
  }, [targetSuccess]);

  useEffect(() => {
    if (!maxBuySuccess) return;
    const timeoutId = window.setTimeout(() => setMaxBuySuccess(""), 2500);
    return () => window.clearTimeout(timeoutId);
  }, [maxBuySuccess]);

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

  const invalidTargetAssetIds = useMemo(() => {
    const invalid = new Set<string>();
    for (const position of positions) {
      const raw = targetInputs[position.asset_id] ?? "";
      if (parseLocalePercent(raw) === null) {
        invalid.add(position.asset_id);
      }
    }
    return invalid;
  }, [positions, targetInputs]);

  const draftTargetByAssetId = useMemo(() => {
    const draft: Record<string, number> = {};
    for (const position of positions) {
      const raw = targetInputs[position.asset_id] ?? "";
      const parsed = parseLocalePercent(raw);
      draft[position.asset_id] = parsed ?? toFinite(position.target_allocation_percent);
    }
    return draft;
  }, [positions, targetInputs]);

  const draftTargetSum = useMemo(() => {
    return positions.reduce((sum, position) => {
      return sum + (draftTargetByAssetId[position.asset_id] ?? 0);
    }, 0);
  }, [draftTargetByAssetId, positions]);

  const targetDelta = 100 - draftTargetSum;
  const isTargetSumValid = Math.abs(targetDelta) < 0.0001;
  const hasInvalidTargets = invalidTargetAssetIds.size > 0;

  const invalidMaxBuyAssetIds = useMemo(() => {
    const invalid = new Set<string>();
    for (const position of positions) {
      const raw = maxBuyInputs[position.asset_id] ?? "";
      const parsed = parseMoneyInput(raw);
      if (!parsed.valid) {
        invalid.add(position.asset_id);
      }
    }
    return invalid;
  }, [maxBuyInputs, positions]);

  const draftMaxBuyByAssetId = useMemo(() => {
    const draft: Record<string, number | null> = {};
    for (const position of positions) {
      const raw = maxBuyInputs[position.asset_id] ?? "";
      const parsed = parseMoneyInput(raw);

      if (parsed.valid) {
        draft[position.asset_id] = parsed.value;
        continue;
      }

      draft[position.asset_id] = position.max_buy_price ?? null;
    }
    return draft;
  }, [maxBuyInputs, positions]);

  const hasInvalidMaxBuy = invalidMaxBuyAssetIds.size > 0;

  const hasUnsavedTargetChanges = useMemo(() => {
    return positions.some((position) => {
      const persisted = toFinite(position.target_allocation_percent);
      const draft = draftTargetByAssetId[position.asset_id] ?? 0;
      return Math.abs(draft - persisted) >= 0.0001;
    });
  }, [draftTargetByAssetId, positions]);

  const hasUnsavedMaxBuyChanges = useMemo(() => {
    return positions.some((position) => {
      const persistedRaw = position.max_buy_price;
      const persisted = persistedRaw == null ? null : Number(persistedRaw);
      const draft = draftMaxBuyByAssetId[position.asset_id] ?? null;

      if (persisted == null && draft == null) return false;
      if (persisted == null || draft == null) return true;
      if (!Number.isFinite(persisted)) return true;

      return Math.abs(draft - persisted) >= 0.0001;
    });
  }, [draftMaxBuyByAssetId, positions]);

  const displayPositions = useMemo(() => {
    return filteredPositions.map((position) => {
      const targetAllocationPercent = draftTargetByAssetId[position.asset_id] ?? 0;
      const targetValue = totalValue > 0
        ? (totalValue * targetAllocationPercent) / 100
        : 0;
      const targetGapValue = targetValue - toFinite(position.current_value);
      const targetGapPercent = targetAllocationPercent - toFinite(position.allocation);
      const maxBuyPrice = draftMaxBuyByAssetId[position.asset_id] ?? null;

      const maxBuyGapValue = maxBuyPrice == null
        ? null
        : maxBuyPrice === 0
          ? 0
          : maxBuyPrice - toFinite(position.current_price);

      const maxBuyGapPercent = maxBuyPrice == null
        ? null
        : maxBuyPrice === 0
          ? 0
          : (maxBuyGapValue! / maxBuyPrice) * 100;

      const isWithinMaxBuyPrice = maxBuyPrice == null
        ? null
        : maxBuyPrice === 0
          ? true
          : toFinite(position.current_price) <= maxBuyPrice;

      return {
        ...position,
        target_allocation_percent: targetAllocationPercent,
        target_value: targetValue,
        target_gap_value: targetGapValue,
        target_gap_percent: targetGapPercent,
        max_buy_price: maxBuyPrice,
        max_buy_gap_value: maxBuyGapValue,
        max_buy_gap_percent: maxBuyGapPercent,
        is_within_max_buy_price: isWithinMaxBuyPrice,
      };
    });
  }, [draftMaxBuyByAssetId, draftTargetByAssetId, filteredPositions, totalValue]);

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

  const clearFilters = () => {
    setSelectedType(null);
    setSelectedSector(null);
  };

  const handleTargetCommit = (assetId: string, rawValue: string) => {
    setTargetSuccess("");
    setTargetError("");

    const masked = sanitizePercentInput(rawValue);
    const parsed = parseLocalePercent(masked);

    setTargetInputs((previous) => ({
      ...previous,
      [assetId]: parsed === null ? masked : formatPercentInput(parsed),
    }));
  };

  const handleMaxBuyCommit = (assetId: string, rawValue: string) => {
    setMaxBuySuccess("");
    setMaxBuyError("");

    setMaxBuyInputs((previous) => ({
      ...previous,
      [assetId]: maskMoneyInput(rawValue),
    }));
  };

  const handleSaveTargets = () => {
    if (!positions.length) return;

    if (hasInvalidTargets) {
      setTargetSuccess("");
      setTargetError("Existem metas inválidas. Revise os percentuais entre 0 e 100.");
      return;
    }

    if (!isTargetSumValid) {
      setTargetSuccess("");
      setTargetError("A soma das metas precisa ser exatamente 100% para salvar.");
      return;
    }

    const targets = positions.map((position) => ({
      asset_id: position.asset_id,
      target_allocation_percent: draftTargetByAssetId[position.asset_id] ?? 0,
    }));

    saveTargetAllocation.mutate(targets);
  };

  const handleSaveMaxBuy = () => {
    if (!positions.length) return;

    if (hasInvalidMaxBuy) {
      setMaxBuySuccess("");
      setMaxBuyError("Existem preços máximos inválidos. Revise os valores informados.");
      return;
    }

    const items = positions.map((position) => ({
      asset_id: position.asset_id,
      max_buy_price: draftMaxBuyByAssetId[position.asset_id] ?? null,
    }));

    saveMaxBuyPrice.mutate(items);
  };

  const handleSimulateContribution = () => {
    setContributionError("");

    const parsed = parseMoneyInput(contributionInput);
    if (!parsed.valid || parsed.value == null || parsed.value <= 0) {
      setContributionResult(null);
      setContributionError("Informe um valor de aporte válido e maior que zero.");
      return;
    }

    simulateContributionPlan.mutate(parsed.value);
  };

  if (summary.isLoading) return <LoadingState />;
  if (summary.isError) return <ErrorState onRetry={() => summary.refetch()} />;
  if (!summary.data) return <ErrorState message="Não foi possível carregar os dados da carteira." onRetry={() => summary.refetch()} />;

  const data = summary.data;
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

      {/* Planejador de Aporte */}
      <div className="card-haveres p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Calculator size={18} className="text-haveres-blue" />
          <h2 className="text-sm font-semibold text-white">Planejador de Aporte</h2>
          <span className="text-xs text-muted-foreground">
            Simula a compra de cotas para aproximar sua carteira da meta de alocação.
          </span>
        </div>

        {(hasUnsavedTargetChanges || hasUnsavedMaxBuyChanges) && (
          <p className="text-xs text-muted-foreground">
            A simulação considera as metas e preços máximos já salvos.
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-[220px]">
            <span className="absolute left-2 top-2 text-xs text-muted-foreground pointer-events-none">R$</span>
            <input
              type="text"
              value={contributionInput}
              inputMode="numeric"
              onChange={(event) => setContributionInput(maskMoneyInput(event.target.value))}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleSimulateContribution();
                }
              }}
              className="w-full bg-secondary border border-haveres-border rounded pl-8 pr-3 py-2 text-sm font-mono text-white focus:outline-none focus:ring-1 focus:ring-haveres-blue"
              placeholder="1.000,00"
            />
          </div>

          <button
            type="button"
            onClick={handleSimulateContribution}
            disabled={simulateContributionPlan.isPending}
            className="px-3 py-2 rounded text-xs font-medium bg-haveres-blue text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {simulateContributionPlan.isPending ? "Simulando..." : "Simular aporte"}
          </button>
        </div>

        {contributionError && <p className="text-xs text-loss">{contributionError}</p>}

        {contributionResult && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2 py-1 rounded bg-secondary text-muted-foreground font-numeric">
                Aporte: {formatCurrency(toFinite(contributionResult.amount))}
              </span>
              <span className="px-2 py-1 rounded bg-secondary text-muted-foreground font-numeric">
                Alocado: {formatCurrency(toFinite(contributionResult.allocated_amount))}
              </span>
              <span className="px-2 py-1 rounded bg-secondary text-muted-foreground font-numeric">
                Saldo: {formatCurrency(toFinite(contributionResult.leftover_amount))}
              </span>
            </div>

            {contributionResult.recommendations.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border border-haveres-border/70">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-haveres-border/70 text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="text-left px-3 py-2">Ativo</th>
                      <th className="text-right px-3 py-2">Qtd</th>
                      <th className="text-right px-3 py-2">Preço</th>
                      <th className="text-right px-3 py-2">Aporte</th>
                      <th className="text-right px-3 py-2">Aloc. proj.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contributionResult.recommendations.map((item) => (
                      <tr key={item.asset_id} className="border-b border-haveres-border/40 last:border-b-0">
                        <td className="px-3 py-2">
                          <p className="font-mono text-haveres-blue text-sm">{item.ticker}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[240px]">{item.name}</p>
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-white">{formatSuggestedQuantity(item.quantity_to_buy)}</td>
                        <td className="px-3 py-2 text-right font-mono text-white">{formatCurrency(toFinite(item.current_price))}</td>
                        <td className="px-3 py-2 text-right font-mono text-white">{formatCurrency(toFinite(item.amount_to_buy))}</td>
                        <td className="px-3 py-2 text-right font-mono text-white">{formatPercent(toFinite(item.projected_allocation_percent))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Nenhuma compra sugerida com o valor informado.</p>
            )}

            {contributionResult.blocked_assets.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-loss">
                  Ativos abaixo da meta, mas bloqueados pelo preço máximo:
                </p>
                <div className="flex flex-wrap gap-2">
                  {contributionResult.blocked_assets.map((item) => (
                    <span key={item.asset_id} className="text-xs px-2 py-1 rounded bg-loss/10 text-loss font-mono">
                      {item.ticker} (máx {formatCurrency(toFinite(item.max_buy_price))})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
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
          <PositionsTable
            positions={displayPositions}
            targetInputs={targetInputs}
            invalidTargetAssetIds={invalidTargetAssetIds}
            maxBuyInputs={maxBuyInputs}
            invalidMaxBuyAssetIds={invalidMaxBuyAssetIds}
            onTargetCommit={handleTargetCommit}
            onMaxBuyCommit={handleMaxBuyCommit}
          />
        )
        }

        {positions.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-haveres-border/70 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground"><TermTooltip term="Meta de Alocação" /></span>
              <span
                className={cn(
                  "text-xs px-2 py-0.5 rounded font-numeric",
                  isTargetSumValid ? "bg-gain/15 text-gain" : "bg-loss/15 text-loss",
                )}
              >
                Soma atual: {formatPercent(draftTargetSum)}
              </span>
              {!isTargetSumValid && (
                <span className="text-xs text-loss font-numeric">
                  {targetDelta > 0
                    ? `Faltam ${formatPercent(targetDelta)}`
                    : `Excesso de ${formatPercent(Math.abs(targetDelta))}`}
                </span>
              )}
              {hasInvalidTargets && (
                <span className="text-xs text-loss">Existem percentuais inválidos.</span>
              )}
              <button
                type="button"
                onClick={handleSaveTargets}
                disabled={saveTargetAllocation.isPending || hasInvalidTargets || !isTargetSumValid || !hasUnsavedTargetChanges}
                className="sm:ml-auto px-3 py-1.5 rounded text-xs font-medium bg-haveres-blue text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saveTargetAllocation.isPending ? "Salvando metas..." : "Salvar metas"}
              </button>
            </div>
            {targetError && <p className="text-xs text-loss">{targetError}</p>}
            {targetSuccess && <p className="text-xs text-gain">{targetSuccess}</p>}
          </div>
        )}

        {positions.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-haveres-border/70 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground"><TermTooltip term="Preço Máximo de Compra" /></span>
              <span className="text-xs px-2 py-0.5 rounded font-numeric bg-secondary text-muted-foreground">
                {positions.filter((position) => (draftMaxBuyByAssetId[position.asset_id] ?? null) != null).length} de {positions.length} ativos configurados
              </span>
              {hasInvalidMaxBuy && (
                <span className="text-xs text-loss">Existem preços máximos inválidos.</span>
              )}
              <button
                type="button"
                onClick={handleSaveMaxBuy}
                disabled={saveMaxBuyPrice.isPending || hasInvalidMaxBuy || !hasUnsavedMaxBuyChanges}
                className="sm:ml-auto px-3 py-1.5 rounded text-xs font-medium bg-haveres-blue text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saveMaxBuyPrice.isPending ? "Salvando preços..." : "Salvar preços máximos"}
              </button>
            </div>
            {maxBuyError && <p className="text-xs text-loss">{maxBuyError}</p>}
            {maxBuySuccess && <p className="text-xs text-gain">{maxBuySuccess}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
