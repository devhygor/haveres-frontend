import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Scale, Calculator, Search, Plus, AlertTriangle, ChevronUp, ChevronDown } from "lucide-react";
import { portfolioApi } from "@/api/portfolio";
import { assetsApi } from "@/api/assets";
import { TransactionFormModal } from "@/components/forms/TransactionFormModal";
import { AssetLogo } from "@/components/common/AssetLogo";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import { TermTooltip } from "@/components/common/TermTooltip";
import { formatCurrency, formatPercent, plClass } from "@/utils/format";
import { cn } from "@/utils/cn";
import { ASSET_TYPE_LABELS } from "@/types/asset";
import type { RebalancePlanTarget, RebalanceSimulationResult, SaveRebalancePlanItem } from "@/types/portfolio";

interface DraftRow {
  asset_id: string;
  ticker: string;
  name: string;
  asset_type: string;
  logo_url: string;
  current_price: number | null;
  current_value: number | null;
  current_allocation: number | null;
  pvp: number | null;
  target_input: string;
  max_buy_input: string;
  max_buy_pvp_input: string;
  include_in_sell_plan: boolean;
}

function toFinite(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function maskPercentInput(value: string): string {
  const normalized = value.replace(/\./g, ",").replace(/\s/g, "").replace(/[^0-9,]/g, "");
  const [integerRaw, ...decimalParts] = normalized.split(",");
  let integerPart = integerRaw.slice(0, 3);
  const decimalPart = decimalParts.join("").slice(0, 2);
  if (normalized.startsWith(",")) integerPart = "0";
  if (!integerPart && !normalized.includes(",")) return "";
  if (!integerPart) return `0,${decimalPart}`;
  const valueAsNumber = Number(`${integerPart}.${decimalPart || "0"}`);
  if (Number.isFinite(valueAsNumber) && valueAsNumber > 100) return "100";
  if (normalized.includes(",")) return `${integerPart},${decimalPart}`;
  return integerPart;
}

function maskMoneyInput(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  const amount = Number(digits) / 100;
  return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}

function maskPvpInput(value: string): string {
  const normalized = value.replace(/\./g, ",").replace(/\s/g, "").replace(/[^0-9,]/g, "");
  const parts = normalized.split(",");
  const intPart = parts[0].slice(0, 2);
  const decPart = parts.length > 1 ? parts.slice(1).join("").slice(0, 4) : null;
  if (!intPart && decPart === null) return "";
  if (decPart !== null) return `${intPart || "0"},${decPart}`;
  return intPart;
}

function parsePercent(value: string): number {
  const trimmed = value.trim();
  if (!trimmed) return 0;
  const parsed = Number(trimmed.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseMoney(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const normalized = trimmed.replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function parsePvp(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed.replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function formatPercentInput(value: number): string {
  if (!Number.isFinite(value) || value === 0) return "";
  return value.toFixed(4).replace(/\.?0+$/, "").replace(".", ",");
}

function formatMoneyInput(value: number | null): string {
  if (value == null) return "";
  return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

function formatPvpInput(value: number | null): string {
  if (value == null) return "";
  return String(value).replace(".", ",");
}

function rowFromTarget(target: RebalancePlanTarget): DraftRow {
  return {
    asset_id: target.asset_id,
    ticker: target.ticker,
    name: target.name,
    asset_type: target.asset_type,
    logo_url: target.logo_url,
    current_price: target.current_price,
    current_value: target.current_value,
    current_allocation: target.current_allocation,
    pvp: target.pvp != null ? Number(target.pvp) : null,
    target_input: formatPercentInput(toFinite(target.target_allocation_percent)),
    max_buy_input: formatMoneyInput(target.max_buy_price),
    max_buy_pvp_input: formatPvpInput(target.max_buy_pvp),
    include_in_sell_plan: target.include_in_sell_plan,
  };
}

function parseApiError(error: unknown, fallback: string): string {
  if (error && typeof error === "object") {
    const maybeError = error as { response?: { data?: { detail?: string } | string } };
    const detail = maybeError.response?.data;
    if (typeof detail === "string" && detail) return detail;
    if (detail && typeof detail === "object" && typeof detail.detail === "string" && detail.detail) {
      return detail.detail;
    }
  }
  return fallback;
}

function formatSuggestedQuantity(value: unknown): string {
  const quantity = toFinite(value);
  if (Math.abs(quantity - Math.trunc(quantity)) < 0.0001) return String(Math.trunc(quantity));
  return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(quantity);
}

const PLAIN_MONEY = (value: number) =>
  new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

export function RebalancingPage() {
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<DraftRow[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [planError, setPlanError] = useState("");
  const [planSuccess, setPlanSuccess] = useState("");
  const [assetSearch, setAssetSearch] = useState("");
  const [assetMenuOpen, setAssetMenuOpen] = useState(false);
  const [externalInput, setExternalInput] = useState("");
  const [simError, setSimError] = useState("");
  const [simResult, setSimResult] = useState<RebalanceSimulationResult | null>(null);
  const [prefill, setPrefill] = useState<{
    asset_id: string; quantity: string; price: string; transaction_type: string;
  } | null>(null);

  const targetsQuery = useQuery({
    queryKey: ["portfolio", "rebalance", "targets"],
    queryFn: () => portfolioApi.getRebalanceTargets().then((r) => r.data),
  });

  const assetsQuery = useQuery({
    queryKey: ["assets"],
    queryFn: () => assetsApi.list().then((r) => r.data),
  });

  useEffect(() => {
    if (!targetsQuery.data) return;
    setRows(targetsQuery.data.items.map(rowFromTarget));
  }, [targetsQuery.data]);

  const savePlan = useMutation({
    mutationFn: (items: SaveRebalancePlanItem[]) => portfolioApi.saveRebalancePlan(items),
    onSuccess: async () => {
      setPlanError("");
      setPlanSuccess("Plano salvo com sucesso.");
      await queryClient.invalidateQueries({ queryKey: ["portfolio", "rebalance", "targets"] });
      await queryClient.invalidateQueries({ queryKey: ["portfolio", "summary"] });
    },
    onError: (error) => {
      setPlanSuccess("");
      setPlanError(parseApiError(error, "Não foi possível salvar o plano. Tente novamente."));
    },
  });

  const simulate = useMutation({
    mutationFn: (externalAmount: number) => portfolioApi.simulateRebalance(externalAmount),
    onSuccess: (response) => {
      setSimError("");
      setSimResult(response.data);
    },
    onError: (error) => {
      setSimResult(null);
      setSimError(parseApiError(error, "Não foi possível simular o rebalanceamento. Tente novamente."));
    },
  });

  useEffect(() => {
    if (!planSuccess) return;
    const timeoutId = window.setTimeout(() => setPlanSuccess(""), 2500);
    return () => window.clearTimeout(timeoutId);
  }, [planSuccess]);

  const targetSum = useMemo(
    () => rows.reduce((sum, row) => sum + parsePercent(row.target_input), 0),
    [rows],
  );
  const targetDelta = 100 - targetSum;
  const isSumValid = Math.abs(targetDelta) < 0.0001;

  const availableTypes = useMemo(() => {
    const seen = new Set<string>();
    rows.forEach((r) => seen.add(r.asset_type));
    return Array.from(seen).sort();
  }, [rows]);

  const filteredRows = useMemo(
    () => (typeFilter === "ALL" ? rows : rows.filter((r) => r.asset_type === typeFilter)),
    [rows, typeFilter],
  );

  type SortKey = "ticker" | "asset_type" | "current_price" | "pvp" | "current_allocation" | "target_input";
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sortedFilteredRows = useMemo(() => {
    if (!sortKey) return filteredRows;
    return [...filteredRows].sort((a, b) => {
      let av: string | number | null = null;
      let bv: string | number | null = null;
      if (sortKey === "ticker") { av = a.ticker; bv = b.ticker; }
      else if (sortKey === "asset_type") { av = a.asset_type; bv = b.asset_type; }
      else if (sortKey === "current_price") { av = a.current_price ?? -Infinity; bv = b.current_price ?? -Infinity; }
      else if (sortKey === "pvp") { av = a.pvp ?? -Infinity; bv = b.pvp ?? -Infinity; }
      else if (sortKey === "current_allocation") { av = a.current_allocation ?? -Infinity; bv = b.current_allocation ?? -Infinity; }
      else if (sortKey === "target_input") { av = parsePercent(a.target_input); bv = parsePercent(b.target_input); }
      if (av === null || bv === null) return 0;
      if (typeof av === "string" && typeof bv === "string") {
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortDir === "asc" ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
  }, [filteredRows, sortKey, sortDir]);

  const persistedByAssetId = useMemo(() => {
    const map = new Map<string, RebalancePlanTarget>();
    for (const item of targetsQuery.data?.items ?? []) map.set(item.asset_id, item);
    return map;
  }, [targetsQuery.data]);

  const hasUnsavedChanges = useMemo(() => {
    if (rows.length !== (targetsQuery.data?.items.length ?? 0)) return true;
    return rows.some((row) => {
      const persisted = persistedByAssetId.get(row.asset_id);
      if (!persisted) return true;
      const targetChanged = Math.abs(parsePercent(row.target_input) - toFinite(persisted.target_allocation_percent)) >= 0.0001;
      const maxBuy = parseMoney(row.max_buy_input);
      const maxBuyChanged = (maxBuy ?? null) !== (persisted.max_buy_price ?? null)
        && Math.abs((maxBuy ?? 0) - (persisted.max_buy_price ?? 0)) >= 0.0001;
      const maxPvp = parsePvp(row.max_buy_pvp_input);
      const maxPvpChanged = (maxPvp ?? null) !== (persisted.max_buy_pvp ?? null)
        && Math.abs((maxPvp ?? 0) - (persisted.max_buy_pvp ?? 0)) >= 0.0001;
      const sellChanged = row.include_in_sell_plan !== persisted.include_in_sell_plan;
      return targetChanged || maxBuyChanged || maxPvpChanged || sellChanged;
    });
  }, [rows, persistedByAssetId, targetsQuery.data]);

  const updateRow = (assetId: string, patch: Partial<DraftRow>) => {
    setPlanSuccess("");
    setPlanError("");
    setRows((prev) => prev.map((row) => (row.asset_id === assetId ? { ...row, ...patch } : row)));
  };

  const removeRow = (assetId: string) => {
    setPlanSuccess("");
    setPlanError("");
    setRows((prev) => {
      const next = prev.filter((row) => row.asset_id !== assetId);
      if (typeFilter !== "ALL" && !next.some((r) => r.asset_type === typeFilter)) {
        setTypeFilter("ALL");
      }
      return next;
    });
  };

  const handleSavePlan = () => {
    if (!isSumValid && targetSum > 0) {
      setPlanSuccess("");
      setPlanError("A soma das metas precisa ser exatamente 100% para salvar.");
      return;
    }
    const items: SaveRebalancePlanItem[] = rows.map((row) => ({
      asset_id: row.asset_id,
      target_allocation_percent: parsePercent(row.target_input),
      max_buy_price: parseMoney(row.max_buy_input),
      max_buy_pvp: parsePvp(row.max_buy_pvp_input),
      include_in_sell_plan: row.include_in_sell_plan,
    }));
    savePlan.mutate(items);
  };

  const handleSimulate = () => {
    setSimError("");
    const external = parseMoney(externalInput) ?? 0;
    simulate.mutate(external);
  };

  const filteredAssets = useMemo(() => {
    const search = assetSearch.trim().toLowerCase();
    if (!search) return [];
    const existingIds = new Set(rows.map((row) => row.asset_id));
    return (assetsQuery.data ?? [])
      .filter((asset) => !existingIds.has(asset.id))
      .filter((asset) =>
        asset.ticker.toLowerCase().includes(search) || asset.name.toLowerCase().includes(search),
      )
      .slice(0, 20);
  }, [assetSearch, assetsQuery.data, rows]);

  const handleAddAsset = (assetId: string, ticker: string, name: string, assetType: string, logoUrl: string) => {
    setPlanSuccess("");
    setPlanError("");
    setAssetSearch("");
    setAssetMenuOpen(false);
    setRows((prev) => {
      if (prev.some((row) => row.asset_id === assetId)) return prev;
      return [
        ...prev,
        {
          asset_id: assetId,
          ticker,
          name,
          asset_type: assetType,
          logo_url: logoUrl,
          current_price: null,
          current_value: null,
          current_allocation: null,
          pvp: null,
          target_input: "",
          max_buy_input: "",
          max_buy_pvp_input: "",
          include_in_sell_plan: false,
        },
      ];
    });
  };

  if (targetsQuery.isLoading) return <LoadingState />;
  if (targetsQuery.isError) return <ErrorState onRetry={() => targetsQuery.refetch()} />;

  const configuredCount = rows.length;

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-2">
          <Scale size={20} className="text-haveres-blue" />
          <h1 className="text-lg font-semibold text-white">Rebalanceamento</h1>
          <span className="text-xs text-muted-foreground">
            Defina metas, limites de compra e simule vendas e aportes para alinhar sua carteira.
          </span>
        </div>

        {hasUnsavedChanges && (
          <div className="flex items-center gap-2 rounded-lg border border-yellow-400/40 bg-yellow-400/5 px-4 py-2 text-xs text-yellow-400">
            <AlertTriangle size={14} className="flex-shrink-0" />
            <span>Há alterações não salvas no plano. A simulação usa apenas as metas já salvas.</span>
          </div>
        )}

        {/* Seção 1 — Tabela de Alvos */}
        <div className="card-haveres">
          <div className="flex flex-wrap items-center gap-2 p-4 sm:p-5 border-b border-haveres-border">
            <h2 className="text-sm font-semibold text-white">Plano de alocação ({configuredCount})</h2>
            <div className="relative w-full sm:w-auto sm:ml-auto">
              <Search size={14} className="absolute left-2.5 top-2.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={assetSearch}
                onChange={(event) => { setAssetSearch(event.target.value); setAssetMenuOpen(true); }}
                onFocus={() => setAssetMenuOpen(true)}
                onBlur={() => window.setTimeout(() => setAssetMenuOpen(false), 150)}
                className="w-full sm:w-[260px] bg-secondary border border-haveres-border rounded pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-haveres-blue"
                placeholder="Buscar ativo para adicionar"
              />
              {assetMenuOpen && filteredAssets.length > 0 && (
                <div className="absolute z-30 mt-1 w-full sm:w-[260px] rounded-lg border border-haveres-border bg-haveres-card shadow-xl max-h-56 overflow-y-auto">
                  {filteredAssets.map((asset) => (
                    <button
                      key={asset.id}
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-white hover:bg-secondary/70 transition-colors"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => handleAddAsset(asset.id, asset.ticker, asset.name, asset.asset_type, asset.logo_url)}
                    >
                      <Plus size={12} className="text-haveres-blue flex-shrink-0" />
                      <span className="font-mono font-medium">{asset.ticker}</span>
                      <span className="text-muted-foreground truncate">{asset.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {rows.length > 0 && availableTypes.length > 1 && (
            <div className="flex flex-wrap gap-1.5 px-4 py-2.5 border-b border-haveres-border">
              <button
                type="button"
                onClick={() => setTypeFilter("ALL")}
                className={cn(
                  "rounded-full px-3 py-0.5 text-xs font-medium transition-colors",
                  typeFilter === "ALL"
                    ? "bg-haveres-blue text-white"
                    : "bg-secondary text-muted-foreground hover:text-white",
                )}
              >
                Todos ({rows.length})
              </button>
              {availableTypes.map((type) => {
                const count = rows.filter((r) => r.asset_type === type).length;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setTypeFilter(type)}
                    className={cn(
                      "rounded-full px-3 py-0.5 text-xs font-medium transition-colors",
                      typeFilter === type
                        ? "bg-haveres-blue text-white"
                        : "bg-secondary text-muted-foreground hover:text-white",
                    )}
                  >
                    {ASSET_TYPE_LABELS[type] ?? type} ({count})
                  </button>
                );
              })}
            </div>
          )}

          {rows.length === 0 ? (
            <EmptyState
              title="Nenhum ativo no plano"
              description="Adicione ativos pela busca acima para começar a definir suas metas de alocação."
            />
          ) : filteredRows.length === 0 ? (
            <EmptyState
              title={`Nenhum ativo do tipo ${ASSET_TYPE_LABELS[typeFilter] ?? typeFilter}`}
              description="Selecione outro filtro ou adicione ativos desse tipo."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] text-sm">
                <thead>
                  <tr className="border-b border-haveres-border text-xs uppercase tracking-wider text-muted-foreground">
                    {(["ticker", "asset_type", "current_price", "pvp", "current_allocation", "target_input"] as SortKey[]).map((key, i) => {
                      const labels: Record<SortKey, React.ReactNode> = {
                        ticker: "Ativo",
                        asset_type: "Tipo",
                        current_price: <TermTooltip term="Cotação" />,
                        pvp: <TermTooltip term="P/VP" />,
                        current_allocation: <TermTooltip term="Alocação" />,
                        target_input: <TermTooltip term="Meta de Alocação" />,
                      };
                      const align = i < 2 ? "text-left" : "text-right";
                      const active = sortKey === key;
                      return (
                        <th
                          key={key}
                          className={`${align} px-3 py-3 cursor-pointer select-none hover:text-white transition-colors`}
                          onClick={() => toggleSort(key)}
                        >
                          <span className="inline-flex items-center gap-1">
                            {labels[key]}
                            {active ? (
                              sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                            ) : (
                              <ChevronUp className="w-3 h-3 opacity-20" />
                            )}
                          </span>
                        </th>
                      );
                    })}
                    <th className="text-right px-3 py-3"><TermTooltip term="Preço Máximo de Compra" /></th>
                    <th className="text-right px-3 py-3"><TermTooltip term="P/VP Máx. Compra" /></th>
                    <th className="text-center px-3 py-3">Vender?</th>
                    <th className="px-3 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {sortedFilteredRows.map((row) => {
                    const isTreasury = row.asset_type === "TREASURY";
                    const pvp = row.pvp;
                    return (
                      <tr key={row.asset_id} className="border-b border-haveres-border/50 hover:bg-secondary/20 transition-colors">
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <AssetLogo logoUrl={row.logo_url} ticker={row.ticker} />
                            <div className="min-w-0">
                              <Link
                                to={`/ativos/${row.ticker}`}
                                className={cn("block truncate max-w-[140px] font-semibold text-haveres-blue hover:text-white text-sm transition-colors", !isTreasury && "font-mono")}
                                title={isTreasury ? row.name : row.ticker}
                              >
                                {isTreasury ? row.name : row.ticker}
                              </Link>
                              <p className="text-xs text-muted-foreground truncate max-w-[140px]" title={isTreasury ? row.ticker : row.name}>
                                {isTreasury ? row.ticker : row.name}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <span className="text-xs px-2 py-0.5 rounded bg-secondary text-muted-foreground font-medium">
                            {ASSET_TYPE_LABELS[row.asset_type] ?? row.asset_type}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-white">
                          {row.current_price != null ? formatCurrency(row.current_price) : "—"}
                        </td>
                        <td className="px-3 py-2 text-right font-mono">
                          {pvp == null ? (
                            <span className="text-muted-foreground">—</span>
                          ) : (
                            <span className={cn(pvp < 1 ? "text-gain" : pvp > 1 ? "text-loss" : "text-white")}>
                              {pvp.toFixed(2).replace(".", ",")}x
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-muted-foreground">
                          {row.current_allocation != null ? formatPercent(row.current_allocation) : "—"}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <div className="relative w-[92px] ml-auto">
                            <input
                              type="text"
                              inputMode="decimal"
                              value={row.target_input}
                              onChange={(event) => updateRow(row.asset_id, { target_input: maskPercentInput(event.target.value) })}
                              className="w-full bg-secondary border border-haveres-border rounded px-2 pr-5 py-1 text-sm font-mono text-white focus:outline-none focus:ring-1 focus:ring-haveres-blue"
                              placeholder="0"
                            />
                            <span className="absolute right-2 top-1.5 text-xs text-muted-foreground pointer-events-none">%</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <div className="relative w-[104px] ml-auto">
                            <span className="absolute left-2 top-1.5 text-xs text-muted-foreground pointer-events-none">R$</span>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={row.max_buy_input}
                              onChange={(event) => updateRow(row.asset_id, { max_buy_input: maskMoneyInput(event.target.value) })}
                              className="w-full bg-secondary border border-haveres-border rounded pl-8 pr-2 py-1 text-sm font-mono text-white focus:outline-none focus:ring-1 focus:ring-haveres-blue"
                              placeholder=""
                            />
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <div className="relative w-[88px] ml-auto">
                            <input
                              type="text"
                              inputMode="decimal"
                              value={row.max_buy_pvp_input}
                              onChange={(event) => updateRow(row.asset_id, { max_buy_pvp_input: maskPvpInput(event.target.value) })}
                              className="w-full bg-secondary border border-haveres-border rounded px-2 pr-5 py-1 text-sm font-mono text-white focus:outline-none focus:ring-1 focus:ring-haveres-blue"
                              placeholder="—"
                            />
                            <span className="absolute right-2 top-1.5 text-xs text-muted-foreground pointer-events-none">x</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={row.include_in_sell_plan}
                            onChange={(event) => updateRow(row.asset_id, { include_in_sell_plan: event.target.checked })}
                            className="h-4 w-4 rounded border-haveres-border bg-secondary text-haveres-blue focus:ring-haveres-blue cursor-pointer"
                          />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => removeRow(row.asset_id)}
                            className="text-xs text-muted-foreground hover:text-loss transition-colors"
                            title="Remover do plano"
                          >
                            Remover
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {rows.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-haveres-border/70 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground"><TermTooltip term="Meta de Alocação" /></span>
                <span className={cn("text-xs px-2 py-0.5 rounded font-numeric", isSumValid ? "bg-gain/15 text-gain" : "bg-loss/15 text-loss")}>
                  Soma atual: {formatPercent(targetSum)}
                </span>
                {!isSumValid && (
                  <span className="text-xs text-loss font-numeric">
                    {targetDelta > 0 ? `Faltam ${formatPercent(targetDelta)}` : `Excesso de ${formatPercent(Math.abs(targetDelta))}`}
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleSavePlan}
                  disabled={savePlan.isPending || !hasUnsavedChanges}
                  className="sm:ml-auto px-3 py-1.5 rounded text-xs font-medium bg-haveres-blue text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savePlan.isPending ? "Salvando..." : "Salvar plano"}
                </button>
              </div>
              {planError && <p className="text-xs text-loss">{planError}</p>}
              {planSuccess && <p className="text-xs text-gain">{planSuccess}</p>}
            </div>
          )}
        </div>

        {/* Seção 2 — Simulador */}
        <div className="card-haveres p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Calculator size={18} className="text-haveres-blue" />
            <h2 className="text-sm font-semibold text-white">Simulador de rebalanceamento</h2>
            <span className="text-xs text-muted-foreground">
              Vende os ativos marcados acima da meta e distribui o caixa (vendas + aporte) nas compras.
            </span>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Aporte externo (opcional)</label>
              <div className="relative w-full sm:w-[220px]">
                <span className="absolute left-2 top-2 text-xs text-muted-foreground pointer-events-none">R$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={externalInput}
                  onChange={(event) => setExternalInput(maskMoneyInput(event.target.value))}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleSimulate();
                    }
                  }}
                  className="w-full bg-secondary border border-haveres-border rounded pl-8 pr-3 py-2 text-sm font-mono text-white focus:outline-none focus:ring-1 focus:ring-haveres-blue"
                  placeholder="0,00"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleSimulate}
              disabled={simulate.isPending}
              className="px-3 py-2 rounded text-xs font-medium bg-haveres-blue text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {simulate.isPending ? "Simulando..." : "Simular rebalanceamento"}
            </button>
          </div>

          {simError && <p className="text-xs text-loss">{simError}</p>}

          {simResult && (
            <div className="space-y-4">
              {/* Cards de resumo */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <SummaryCard label="Aporte externo" value={formatCurrency(toFinite(simResult.external_amount))} />
                <SummaryCard label="Receita de vendas" value={formatCurrency(toFinite(simResult.sell_proceeds))} />
                <SummaryCard label="Total disponível" value={formatCurrency(toFinite(simResult.total_available))} />
                <SummaryCard label="Saldo" value={formatCurrency(toFinite(simResult.leftover_amount))} />
              </div>

              {/* Vendas */}
              {simResult.sell_recommendations.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-loss">Vendas sugeridas</h3>
                  <div className="overflow-x-auto rounded-lg border border-loss/30">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-haveres-border/70 text-xs uppercase tracking-wider text-muted-foreground">
                          <th className="text-left px-3 py-2">Ativo</th>
                          <th className="text-right px-3 py-2">Qtd</th>
                          <th className="text-right px-3 py-2">Preço</th>
                          <th className="text-right px-3 py-2">Receita</th>
                          <th className="text-right px-3 py-2">Aloc. proj.</th>
                          <th className="px-3 py-2" />
                        </tr>
                      </thead>
                      <tbody>
                        {simResult.sell_recommendations.map((item) => (
                          <tr key={item.asset_id} className="border-b border-haveres-border/40 last:border-b-0">
                            <td className="px-3 py-1.5">
                              <Link to={`/ativos/${item.ticker}`} className="font-mono text-haveres-blue hover:text-white text-[13px] transition-colors">{item.ticker}</Link>
                              <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">{item.name}</p>
                            </td>
                            <td className="px-3 py-1.5 text-right font-mono text-white">{formatSuggestedQuantity(item.quantity_to_sell)}</td>
                            <td className="px-3 py-1.5 text-right font-mono text-white">{formatCurrency(toFinite(item.current_price))}</td>
                            <td className="px-3 py-1.5 text-right font-mono text-loss">{formatCurrency(toFinite(item.amount_to_sell))}</td>
                            <td className="px-3 py-1.5 text-right font-mono text-white">{formatPercent(toFinite(item.projected_allocation_percent))}</td>
                            <td className="px-3 py-1.5 text-right">
                              <button
                                type="button"
                                title="Registrar venda"
                                onClick={() => setPrefill({
                                  asset_id: item.asset_id,
                                  quantity: formatSuggestedQuantity(item.quantity_to_sell),
                                  price: PLAIN_MONEY(toFinite(item.current_price)),
                                  transaction_type: "SELL",
                                })}
                                className="px-2 py-0.5 rounded text-xs font-medium bg-loss/20 text-loss hover:bg-loss hover:text-white transition-colors"
                              >
                                - Vender
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Compras */}
              {simResult.buy_recommendations.length > 0 ? (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gain">Compras sugeridas</h3>
                  <div className="overflow-x-auto rounded-lg border border-gain/30">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-haveres-border/70 text-xs uppercase tracking-wider text-muted-foreground">
                          <th className="text-left px-3 py-2">Ativo</th>
                          <th className="text-right px-3 py-2">Qtd</th>
                          <th className="text-right px-3 py-2">Preço</th>
                          <th className="text-right px-3 py-2">Aporte</th>
                          <th className="text-right px-3 py-2">Desvio</th>
                          <th className="text-right px-3 py-2">Aloc. proj.</th>
                          <th className="px-3 py-2" />
                        </tr>
                      </thead>
                      <tbody>
                        {simResult.buy_recommendations.map((item) => (
                          <tr key={item.asset_id} className="border-b border-haveres-border/40 last:border-b-0">
                            <td className="px-3 py-1.5">
                              <div className="flex items-center gap-1.5">
                                <Link to={`/ativos/${item.ticker}`} className="font-mono text-haveres-blue hover:text-white text-[13px] transition-colors">{item.ticker}</Link>
                                {item.is_new_asset && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-haveres-blue/15 text-haveres-blue font-medium">novo</span>
                                )}
                              </div>
                              <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">{item.name}</p>
                            </td>
                            <td className="px-3 py-1.5 text-right font-mono text-white">{formatSuggestedQuantity(item.quantity_to_buy)}</td>
                            <td className="px-3 py-1.5 text-right font-mono text-white">{formatCurrency(toFinite(item.current_price))}</td>
                            <td className="px-3 py-1.5 text-right font-mono text-gain">{formatCurrency(toFinite(item.amount_to_buy))}</td>
                            <td className="px-3 py-1.5 text-right font-mono">
                              <span className={cn(plClass(toFinite(item.target_gap_value_before)))}>
                                {formatCurrency(toFinite(item.target_gap_value_before))}
                              </span>
                            </td>
                            <td className="px-3 py-1.5 text-right font-mono text-white">{formatPercent(toFinite(item.projected_allocation_percent))}</td>
                            <td className="px-3 py-1.5 text-right">
                              <button
                                type="button"
                                title="Registrar compra"
                                onClick={() => setPrefill({
                                  asset_id: item.asset_id,
                                  quantity: formatSuggestedQuantity(item.quantity_to_buy),
                                  price: PLAIN_MONEY(toFinite(item.current_price)),
                                  transaction_type: "BUY",
                                })}
                                className="px-2 py-0.5 rounded text-xs font-medium bg-gain/20 text-gain hover:bg-gain hover:text-white transition-colors"
                              >
                                + Comprar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Nenhuma compra sugerida com o caixa disponível.</p>
              )}

              {/* Bloqueados */}
              {simResult.blocked_assets.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-loss">Ativos abaixo da meta, mas bloqueados pelos limites de compra:</p>
                  <div className="flex flex-wrap gap-2">
                    {simResult.blocked_assets.map((item) => (
                      <span key={item.asset_id} className="text-xs px-2 py-1 rounded bg-loss/10 text-loss font-mono" title={item.reason}>
                        <Link to={`/ativos/${item.ticker}`} className="hover:underline">{item.ticker}</Link>
                        {item.max_buy_price != null && ` (máx ${formatCurrency(toFinite(item.max_buy_price))})`}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <TransactionFormModal
        open={prefill !== null}
        onClose={() => setPrefill(null)}
        prefill={prefill ?? undefined}
      />
    </>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-haveres-border bg-secondary/30 px-3 py-2">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-white font-numeric">{value}</p>
    </div>
  );
}
