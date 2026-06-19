import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { dividendsApi } from "@/api/dividends";
import { portfolioApi } from "@/api/portfolio";
import { DividendsChart } from "@/components/charts/DividendsChart";
import { AllocationChart } from "@/components/charts/AllocationChart";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import { DividendFormModal } from "@/components/forms/DividendFormModal";
import { formatCurrency, formatDate, formatDateShort } from "@/utils/format";
import { TrendingUp, Plus, Pencil, Trash2, RefreshCw, PieChart, BarChart3, CalendarDays } from "lucide-react";
import { SourceBadge } from "@/components/common/SourceBadge";
import { AssetLogo } from "@/components/common/AssetLogo";
import type { Dividend } from "@/types/dividend";
import type { AllocationItem } from "@/types/portfolio";
import { Link } from "react-router-dom";

const TYPE_COLORS: Record<string, string> = {
  DIVIDEND: "text-gain",
  JCP: "text-haveres-blue",
  FII_INCOME: "text-gain",
  AMORTIZATION: "text-muted-foreground",
  SUBSCRIPTION_RIGHTS: "text-haveres-blue",
  OTHER: "text-muted-foreground",
};

const EVOLUTION_RANGE_OPTIONS = [
  { label: "12 meses", value: 12 },
  { label: "24 meses", value: 24 },
  { label: "36 meses", value: 36 },
  { label: "Todo período", value: 0 },
] as const;

export function DividendsPage() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Dividend | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [historySearch, setHistorySearch] = useState("");
  const [upcomingSearch, setUpcomingSearch] = useState("");
  const [selectedDividendType, setSelectedDividendType] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [evolutionRangeMonths, setEvolutionRangeMonths] = useState<number>(12);

  const dividends = useQuery({
    queryKey: ["dividends"],
    queryFn: () => dividendsApi.list().then(r => r.data),
  });
  const upcoming = useQuery({
    queryKey: ["portfolio", "upcoming-dividends"],
    queryFn: () => portfolioApi.getUpcomingDividends().then(r => r.data),
    staleTime: 1000 * 60 * 5,
  });

  const deleteDividend = useMutation({
    mutationFn: (id: string) => dividendsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dividends"] });
      qc.invalidateQueries({ queryKey: ["portfolio"] });
      setDeletingId(null);
    },
  });

  const syncDividends = useMutation({
    mutationFn: () => dividendsApi.sync(),
    onMutate: () => {
      qc.invalidateQueries({ queryKey: ["dividends", "sync-progress"] });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dividends"] });
      qc.invalidateQueries({ queryKey: ["portfolio"] });
      qc.invalidateQueries({ queryKey: ["dividends", "sync-progress"] });
    },
    onError: () => {
      qc.invalidateQueries({ queryKey: ["dividends", "sync-progress"] });
    },
  });

  const syncProgress = useQuery({
    queryKey: ["dividends", "sync-progress"],
    queryFn: () => dividendsApi.syncProgress().then((r) => r.data),
    refetchInterval: (query) => {
      const state = query.state.data;
      return state?.status === "running" || state?.status === "queued" ? 1500 : 10000;
    },
  });

  const openCreate = () => { setEditing(undefined); setModalOpen(true); };
  const openEdit = (d: Dividend) => { setEditing(d); setModalOpen(true); };

  const byType: AllocationItem[] = useMemo(() => {
    const d = dividends.data ?? [];
    const totalNet = d.reduce((s, x) => s + Number(x.net_amount), 0);
    if (!d.length || totalNet === 0) return [];
    const map: Record<string, { type_display: string; value: number }> = {};
    d.forEach((x) => {
      if (!map[x.dividend_type]) {
        map[x.dividend_type] = { type_display: x.dividend_type_display, value: 0 };
      }
      map[x.dividend_type].value += Number(x.net_amount);
    });

    return Object.entries(map).map(([type, entry]) => ({
      type,
      type_display: entry.type_display,
      value: entry.value,
      allocation: (entry.value / totalNet) * 100,
    }));
  }, [dividends.data]);

  const filteredData = useMemo(() => {
    const d = dividends.data ?? [];
    if (!selectedDividendType) return d;
    return d.filter((item) => item.dividend_type === selectedDividendType);
  }, [dividends.data, selectedDividendType]);

  const upcomingFallbackMonth = useMemo(() => {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return nextMonth.toISOString().slice(0, 7);
  }, []);

  const historyData = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    let data = filteredData
      .filter((d) => !d.payment_date || d.payment_date < today);

    if (selectedMonth) {
      data = data.filter((d) => ((d.payment_date ?? d.ex_date).slice(0, 7) === selectedMonth));
    }

    return data
      .sort((a, b) => (b.payment_date ?? b.ex_date).localeCompare(a.payment_date ?? a.ex_date));
  }, [filteredData, selectedMonth]);

  const upcomingByType = useMemo(() => {
    const d = upcoming.data ?? [];
    if (!selectedDividendType) return d;
    return d.filter((item) => item.dividend_type === selectedDividendType);
  }, [selectedDividendType, upcoming.data]);

  const filteredUpcoming = useMemo(() => {
    if (!selectedMonth) return upcomingByType;
    return upcomingByType.filter((item) => {
      const monthKey = item.expected_date?.slice(0, 7) || upcomingFallbackMonth;
      return monthKey === selectedMonth;
    });
  }, [selectedMonth, upcomingByType, upcomingFallbackMonth]);

  const searchedUpcoming = useMemo(() => {
    const search = upcomingSearch.trim().toLowerCase();
    if (!search) return filteredUpcoming;

    return filteredUpcoming.filter((item) => {
      const ticker = item.ticker?.toLowerCase() ?? "";
      const name = item.name?.toLowerCase() ?? "";
      return ticker.includes(search) || name.includes(search);
    });
  }, [filteredUpcoming, upcomingSearch]);

  const chartData = useMemo(() => {
    if (!filteredData.length && !upcomingByType.length) return [];
    const today = new Date().toISOString().split("T")[0];

    const monthTotals: Record<string, {
      paid: number;
      upcoming: number;
      paidByType: Record<string, number>;
      upcomingByType: Record<string, number>;
    }> = {};

    const typeDisplayMap: Record<string, string> = {};

    const ensureMonth = (monthKey: string) => {
      if (!monthTotals[monthKey]) {
        monthTotals[monthKey] = {
          paid: 0,
          upcoming: 0,
          paidByType: {},
          upcomingByType: {},
        };
      }
      return monthTotals[monthKey];
    };

    const buildTypeDetails = (typeTotals: Record<string, number>) => (
      Object.entries(typeTotals)
        .filter(([, amount]) => amount > 0)
        .map(([type, amount]) => ({
          type,
          label: typeDisplayMap[type] ?? type,
          amount,
        }))
        .sort((a, b) => b.amount - a.amount)
    );

    filteredData.forEach((item) => {
      typeDisplayMap[item.dividend_type] = item.dividend_type_display;
      if (item.payment_date && item.payment_date >= today) {
        return;
      }
      const monthKey = (item.payment_date || item.ex_date).slice(0, 7);
      if (!monthKey) return;
      const month = ensureMonth(monthKey);
      const amount = Number(item.net_amount);
      month.paid += amount;
      month.paidByType[item.dividend_type] = (month.paidByType[item.dividend_type] ?? 0) + amount;
    });

    upcomingByType.forEach((item) => {
      typeDisplayMap[item.dividend_type] = item.dividend_type_display;
      const monthKey = (item.expected_date?.slice(0, 7) || upcomingFallbackMonth);
      if (!monthKey) return;
      const month = ensureMonth(monthKey);
      const amount = Number(item.expected_amount);
      month.upcoming += amount;
      month.upcomingByType[item.dividend_type] = (month.upcomingByType[item.dividend_type] ?? 0) + amount;
    });

    const monthlyData = Object.entries(monthTotals)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, values]) => ({
        month: `${month}-01`,
        paid: values.paid,
        upcoming: values.upcoming,
        paid_details: buildTypeDetails(values.paidByType),
        upcoming_details: buildTypeDetails(values.upcomingByType),
      }));
    if (evolutionRangeMonths === 0) return monthlyData;
    return monthlyData.slice(-evolutionRangeMonths);
  }, [filteredData, upcomingByType, evolutionRangeMonths, upcomingFallbackMonth]);

  const selectedEvolutionRangeLabel = useMemo(() => {
    return EVOLUTION_RANGE_OPTIONS.find((option) => option.value === evolutionRangeMonths)?.label ?? "12 meses";
  }, [evolutionRangeMonths]);

  const selectedTypeLabel = useMemo(() => {
    if (!selectedDividendType) return null;
    return byType.find((entry) => entry.type === selectedDividendType)?.type_display ?? selectedDividendType;
  }, [byType, selectedDividendType]);

  useEffect(() => {
    if (!selectedDividendType) return;
    if (!byType.some((entry) => entry.type === selectedDividendType)) {
      setSelectedDividendType(null);
    }
  }, [byType, selectedDividendType]);

  useEffect(() => {
    if (!selectedMonth) return;
    const hasSelectedMonthInChart = chartData.some((item) => item.month.slice(0, 7) === selectedMonth);
    if (!hasSelectedMonthInChart) {
      setSelectedMonth(null);
    }
  }, [chartData, selectedMonth]);

  const hasActiveTypeFilter = selectedDividendType !== null;
  const hasActiveMonthFilter = selectedMonth !== null;

  const dividendSync = syncProgress.data;
  const dividendSyncPct =
    dividendSync && dividendSync.total > 0
      ? Math.round((dividendSync.done / dividendSync.total) * 100)
      : 0;
  const isDividendSyncRunning = dividendSync?.status === "running" || dividendSync?.status === "queued";

  const prevSyncStatus = useRef<string | undefined>(undefined);
  useEffect(() => {
    const status = dividendSync?.status;
    if (prevSyncStatus.current && prevSyncStatus.current !== status && status === "done") {
      qc.invalidateQueries({ queryKey: ["dividends"] });
      qc.invalidateQueries({ queryKey: ["portfolio"] });
    }
    prevSyncStatus.current = status;
  }, [dividendSync?.status]);

  const clearTypeFilter = () => {
    setSelectedDividendType(null);
  };

  const clearMonthFilter = () => {
    setSelectedMonth(null);
  };

  const clearAllFilters = () => {
    setSelectedDividendType(null);
    setSelectedMonth(null);
  };

  const handleSelectMonth = (month: string) => {
    setSelectedMonth((current) => (current === month ? null : month));
  };

  const selectedMonthLabel = useMemo(() => {
    if (!selectedMonth) return null;
    return formatDateShort(`${selectedMonth}-01`);
  }, [selectedMonth]);

  const byAsset = useMemo(() => {
    const d = filteredData;
    const map: Record<string, { ticker: string; total: number }> = {};
    d.forEach(x => {
      if (!map[x.asset_ticker]) map[x.asset_ticker] = { ticker: x.asset_ticker, total: 0 };
      map[x.asset_ticker].total += Number(x.net_amount);
    });
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 10);
  }, [filteredData]);

  const trailing12mNet = useMemo(() => {
    const cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - 1);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);
    return (dividends.data ?? [])
      .filter(d => {
        const dateKey = d.payment_date ?? d.ex_date;
        return dateKey >= cutoffStr && dateKey <= today;
      })
      .reduce((s, d) => s + Number(d.net_amount), 0);
  }, [dividends.data]);

  const thisMonthNet = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const today = new Date().toISOString().slice(0, 10);
    return (dividends.data ?? [])
      .filter(d => {
        const dateKey = d.payment_date ?? d.ex_date;
        return dateKey.slice(0, 7) === currentMonth && dateKey <= today;
      })
      .reduce((s, d) => s + Number(d.net_amount), 0);
  }, [dividends.data]);

  const upcomingNetTotal = useMemo(() => {
    return (upcoming.data ?? []).reduce((s, d) => s + Number(d.expected_amount), 0);
  }, [upcoming.data]);

  const searchedHistoryData = useMemo(() => {
    const search = historySearch.trim().toLowerCase();
    if (!search) return historyData;

    return historyData.filter((item) => {
      const ticker = item.asset_ticker?.toLowerCase() ?? "";
      const name = item.asset_name?.toLowerCase() ?? "";
      return ticker.includes(search) || name.includes(search);
    });
  }, [historyData, historySearch]);

  if (dividends.isLoading) return <LoadingState />;
  if (dividends.isError) return <ErrorState onRetry={() => dividends.refetch()} />;

  const data = dividends.data ?? [];
  const totalGross = filteredData.reduce((s, d) => s + Number(d.gross_amount), 0);
  const totalNet = filteredData.reduce((s, d) => s + Number(d.net_amount), 0);
  const totalIR = filteredData.reduce((s, d) => s + Number(d.ir_withheld), 0);

  return (
    <>
      <div className="space-y-6">
        {/* Resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Bruto + distribuição por tipo */}
          <div className="card-haveres p-5">
            <p className="text-xs text-muted-foreground mb-2">Total Bruto</p>
            <p className="text-xl font-bold font-numeric text-gain">{formatCurrency(totalGross)}</p>
            {byType.length > 0 && (
              <div className="mt-3 pt-3 border-t border-haveres-border/70 space-y-1.5">
                {byType.map((t) => (
                  <div key={t.type} className="flex items-center justify-between gap-2">
                    <span className={`text-xs font-medium truncate ${(t.type && TYPE_COLORS[t.type]) || "text-muted-foreground"}`}>
                      {t.type_display}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[11px] text-muted-foreground font-numeric">{t.allocation.toFixed(0)}%</span>
                      <span className="text-xs font-semibold text-white font-numeric">{formatCurrency(t.value)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Líquido + IR como detalhe */}
          <div className="card-haveres p-5">
            <p className="text-xs text-muted-foreground mb-2">Total Líquido</p>
            <p className="text-xl font-bold font-numeric text-white">{formatCurrency(totalNet)}</p>
            <div className="mt-3 pt-3 border-t border-haveres-border/70">
              <p className="text-xs text-muted-foreground">IR Retido</p>
              <p className="text-sm font-semibold text-muted-foreground font-numeric">{formatCurrency(totalIR)}</p>
              {totalGross > 0 && (
                <p className="text-[11px] text-muted-foreground/70 font-numeric mt-0.5">
                  {((totalIR / totalGross) * 100).toFixed(1)}% do bruto
                </p>
              )}
            </div>
          </div>

          {/* Período: 12m + no mês + a receber */}
          <div className="card-haveres p-5">
            <p className="text-xs text-muted-foreground mb-2">Últimos 12 meses</p>
            <p className="text-xl font-bold font-numeric text-white">{formatCurrency(trailing12mNet)}</p>
            <div className="mt-3 pt-3 border-t border-haveres-border/70 grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">No mês</p>
                <p className="text-sm font-semibold text-white font-numeric">{formatCurrency(thisMonthNet)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">A receber</p>
                <p className="text-sm font-semibold text-haveres-blue font-numeric">{formatCurrency(upcomingNetTotal)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Distribuição por tipo + por ativo */}
        {(byType.length > 0 || byAsset.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {byType.length > 0 && (
              <div className="card-haveres p-5">
                <div className="flex items-center gap-2 mb-4">
                  <PieChart size={18} className="text-haveres-blue" />
                  <h2 className="text-sm font-semibold text-white">Proventos por Tipo</h2>
                  {hasActiveTypeFilter && selectedTypeLabel ? (
                    <>
                      <span className="text-xs px-2 py-0.5 rounded bg-secondary text-muted-foreground">
                        Tipo: {selectedTypeLabel}
                      </span>
                      <button
                        type="button"
                        onClick={clearTypeFilter}
                        className="ml-auto text-xs px-2 py-1 rounded bg-secondary text-muted-foreground hover:text-white transition-colors"
                      >
                        Limpar filtro
                      </button>
                    </>
                  ) : null}
                </div>
                <AllocationChart
                  data={byType}
                  labelKey="type_display"
                  valueKey="type"
                  selectedValue={selectedDividendType}
                  onSelectValue={setSelectedDividendType}
                />
              </div>
            )}
            {byAsset.length > 0 && (
              <div className="card-haveres p-5">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 size={18} className="text-gain" />
                  <h2 className="text-sm font-semibold text-white">Top Ativos (líquido)</h2>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={byAsset} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" horizontal={false} />
                    <XAxis type="number" tick={{ fill: "#718096", fontSize: 11 }} axisLine={false} tickLine={false}
                      tickFormatter={(v) => formatCurrency(v, true)} />
                    <YAxis type="category" dataKey="ticker" tick={{ fill: "#a0aec0", fontSize: 11 }}
                      axisLine={false} tickLine={false} width={52} />
                    <Tooltip
                      cursor={{ fill: "rgba(160, 174, 192, 0.12)" }}
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        return (
                          <div className="bg-haveres-card border border-haveres-border rounded-lg p-3 shadow-xl text-xs">
                            <p className="text-white font-mono font-semibold mb-1">{payload[0].payload.ticker}</p>
                            <p className="text-gain font-mono">{formatCurrency(payload[0].value as number)}</p>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="total" name="Líquido" fill="#22c55e" radius={[0, 4, 4, 0]} maxBarSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* Gráfico mensal */}
        {(filteredData.length > 0 || upcomingByType.length > 0) ? (
          <div className="card-haveres p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={18} className="text-gain" />
              <h2 className="text-sm font-semibold text-white">Proventos por Mês</h2>
              {hasActiveMonthFilter && selectedMonthLabel && (
                <>
                  <span className="text-xs px-2 py-0.5 rounded bg-secondary text-muted-foreground">
                    Mês: {selectedMonthLabel}
                  </span>
                  <button
                    type="button"
                    onClick={clearMonthFilter}
                    className="text-xs px-2 py-1 rounded bg-secondary text-muted-foreground hover:text-white transition-colors"
                  >
                    Limpar mês
                  </button>
                </>
              )}
              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Período</span>
                <select
                  value={evolutionRangeMonths}
                  onChange={(event) => setEvolutionRangeMonths(Number(event.target.value))}
                  className="bg-secondary border border-haveres-border text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-haveres-blue"
                >
                  {EVOLUTION_RANGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Exibindo {selectedEvolutionRangeLabel.toLowerCase()}.
              {hasActiveMonthFilter && selectedMonthLabel ? ` Filtro ativo no mês ${selectedMonthLabel}.` : ""}
            </p>
            {chartData.length ? (
              <DividendsChart
                data={chartData}
                selectedMonth={selectedMonth}
                onMonthSelect={handleSelectMonth}
              />
            ) : (
              <p className="text-sm text-muted-foreground py-4">
                Sem dados nesse período. Selecione um intervalo maior para visualizar mais histórico.
              </p>
            )}
          </div>
        ) : null}

        {/* Proventos a Receber */}
        {(filteredUpcoming.length > 0 || hasActiveTypeFilter || hasActiveMonthFilter) && (
          <div className="card-haveres p-5">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <CalendarDays size={18} className="text-haveres-blue" />
              <h2 className="text-sm font-semibold text-white">A Receber</h2>
              <span className="text-xs text-muted-foreground">
                {searchedUpcoming.length} proventos agendados
                {upcomingSearch.trim()
                  ? ` de ${filteredUpcoming.length}`
                  : hasActiveTypeFilter || hasActiveMonthFilter
                    ? ` de ${upcomingByType.length}`
                    : ""}
              </span>
              <div className="w-full sm:w-auto sm:ml-auto flex items-center gap-2">
                <input
                  type="text"
                  value={upcomingSearch}
                  onChange={(event) => setUpcomingSearch(event.target.value)}
                  className="w-full sm:w-[220px] bg-secondary border border-haveres-border rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-haveres-blue"
                  placeholder="Buscar ativo"
                />
                {upcomingSearch.trim() && (
                  <button
                    type="button"
                    onClick={() => setUpcomingSearch("")}
                    className="shrink-0 px-3 py-1.5 rounded bg-secondary text-muted-foreground hover:text-white text-xs transition-colors"
                  >
                    Limpar busca
                  </button>
                )}
              </div>
            </div>
            {filteredUpcoming.length > 0 ? (
              searchedUpcoming.length > 0 ? (
                <div className="relative max-h-[70vh] overflow-auto">
                  <table className="w-full min-w-[760px] text-sm">
                    <thead>
                      <tr className="border-b border-haveres-border">
                        {["Pgto", "Código", "Tipo", "Qtd", "Valor/ação", "Total Bruto"].map((h, i) => (
                          <th key={i} className="sticky top-0 z-10 bg-haveres-card text-left py-2 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {searchedUpcoming.map((d, i) => (
                        <tr key={`${d.ticker}-${d.expected_date}-${i}`} className="border-b border-haveres-border/50 hover:bg-secondary/30">
                          <td className="py-2 px-4 text-muted-foreground text-xs">
                            {d.expected_date ? formatDate(d.expected_date) : "—"}
                          </td>
                          <td className="py-2 px-4">
                            <div className="flex items-center gap-2">
                              <AssetLogo logoUrl={d.logo_url} ticker={d.ticker} size={20} />
                              <Link to={`/ativos/${d.ticker}`} className="font-mono font-semibold text-haveres-blue hover:text-white text-sm transition-colors">{d.ticker}</Link>
                            </div>
                          </td>
                          <td className="py-2 px-4">
                            <span className={`text-xs font-medium ${TYPE_COLORS[d.dividend_type] ?? "text-muted-foreground"}`}>
                              {d.dividend_type_display}
                            </span>
                          </td>
                          <td className="py-2 px-4 font-numeric text-sm">{Number(d.quantity).toFixed(0)}</td>
                          <td className="py-2 px-4 font-numeric text-sm">{formatCurrency(d.value_per_share)}</td>
                          <td className="py-2 px-4 font-numeric text-sm text-gain font-medium">{formatCurrency(d.expected_amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-4">
                  Nenhum provento encontrado para a busca.
                </p>
              )
            ) : (
              <p className="text-sm text-muted-foreground py-4">
                Nenhum provento agendado para o filtro selecionado.
              </p>
            )}
          </div>
        )}

        {/* Tabela */}
        <div className="card-haveres">
          <div className="flex flex-wrap items-center gap-2 p-4 sm:p-5 border-b border-haveres-border">
            <h2 className="text-sm font-semibold text-white">Histórico de Proventos</h2>
            <span className="text-xs text-muted-foreground">
              {searchedHistoryData.length} registros
              {historySearch.trim()
                ? ` de ${historyData.length}`
                : hasActiveTypeFilter || hasActiveMonthFilter
                  ? ` de ${filteredData.length}`
                  : ""}
            </span>
            <div className="w-full sm:w-auto sm:ml-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="w-full sm:w-auto flex items-center gap-2">
                <input
                  type="text"
                  value={historySearch}
                  onChange={(event) => setHistorySearch(event.target.value)}
                  className="w-full sm:w-[220px] bg-secondary border border-haveres-border rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-haveres-blue"
                  placeholder="Buscar ativo"
                />
                {historySearch.trim() && (
                  <button
                    type="button"
                    onClick={() => setHistorySearch("")}
                    className="shrink-0 px-3 py-1.5 rounded bg-secondary text-muted-foreground hover:text-white text-xs transition-colors"
                  >
                    Limpar busca
                  </button>
                )}
              </div>
              {hasActiveTypeFilter && (
                <button
                  type="button"
                  onClick={clearTypeFilter}
                  className="w-full sm:w-auto justify-center flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-muted-foreground text-xs font-medium rounded-lg hover:text-white transition-colors"
                >
                  Limpar filtro
                </button>
              )}
              {hasActiveMonthFilter && (
                <button
                  type="button"
                  onClick={clearMonthFilter}
                  className="w-full sm:w-auto justify-center flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-muted-foreground text-xs font-medium rounded-lg hover:text-white transition-colors"
                >
                  Limpar mês
                </button>
              )}
              <div className="w-full sm:w-auto flex items-center justify-center gap-2">
                <button
                  onClick={() => syncDividends.mutate()}
                  disabled={syncDividends.isPending}
                  className="flex-1 sm:flex-none justify-center flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-muted-foreground text-xs font-medium rounded-lg hover:text-white transition-colors disabled:opacity-50"
                  title="Sincronizar proventos via Brapi"
                >
                  <RefreshCw size={13} className={syncDividends.isPending ? "animate-spin" : ""} />
                  Sincronizar Proventos
                </button>
                {dividendSync && dividendSync.status !== "idle" && (
                  <span
                    className={`text-xs font-medium font-numeric ${isDividendSyncRunning ? "text-haveres-blue" : "text-muted-foreground"}`}
                  >
                    {dividendSync.total > 0 ? `${Math.min(dividendSyncPct, 100)}%` : isDividendSyncRunning ? "0%" : "-"}
                  </span>
                )}
              </div>
              <button
                onClick={openCreate}
                className="w-full sm:w-auto justify-center flex items-center gap-1.5 px-3 py-1.5 bg-haveres-blue text-white text-xs font-medium rounded-lg hover:bg-haveres-blue-dark transition-colors"
              >
                <Plus size={13} /> Novo Provento
              </button>
            </div>
          </div>

          {!data.length ? (
            <EmptyState
              title="Nenhum provento registrado"
              description="Registre dividendos, JCP e rendimentos de FII recebidos."
              action={
                <button
                  onClick={openCreate}
                  className="flex items-center gap-1.5 px-4 py-2 bg-haveres-blue text-white text-sm font-medium rounded-lg hover:bg-haveres-blue-dark transition-colors"
                >
                  <Plus size={14} /> Adicionar provento
                </button>
              }
            />
          ) : !historyData.length ? (
            <EmptyState
              title="Nenhum provento para este filtro"
              description="Selecione outra fatia no gráfico ou limpe o filtro aplicado."
              action={(
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="flex items-center gap-1.5 px-4 py-2 bg-secondary text-muted-foreground text-sm font-medium rounded-lg hover:text-white transition-colors"
                >
                  Limpar filtros
                </button>
              )}
            />
          ) : !searchedHistoryData.length ? (
            <EmptyState
              title="Nenhum provento encontrado"
              description="Tente outro código ou nome de ativo na busca."
            />
          ) : (
            <div className="relative max-h-[70vh] overflow-auto">
              <table className="w-full min-w-[1100px] text-sm">
                <thead>
                  <tr className="border-b border-haveres-border">
                    {["Data com", "Pgto", "Código", "Tipo", "Qtd", "Valor/ação", "Bruto", "IR", "Líquido", "Origem", ""].map((h, i) => (
                      <th key={i} className="sticky top-0 z-10 bg-haveres-card text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {searchedHistoryData.map(d => (
                    <tr key={d.id} className="border-b border-haveres-border/50 hover:bg-secondary/30 group">
                      <td className="py-3 px-4 text-muted-foreground text-xs">{formatDate(d.ex_date)}</td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">{d.payment_date ? formatDate(d.payment_date) : "—"}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <AssetLogo logoUrl={d.asset_logo_url} ticker={d.asset_ticker} />
                          <div>
                            <Link to={`/ativos/${d.asset_ticker}`} className="font-mono font-semibold text-haveres-blue hover:text-white text-sm transition-colors">{d.asset_ticker}</Link>
                            <p className="text-xs text-muted-foreground truncate max-w-[120px]" title={d.asset_name}>
                              {d.asset_name}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs font-medium ${TYPE_COLORS[d.dividend_type] ?? "text-muted-foreground"}`}>
                          {d.dividend_type_display}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-numeric text-sm">{d.quantity_held}</td>
                      <td className="py-3 px-4 font-numeric text-sm">{formatCurrency(Number(d.value_per_share))}</td>
                      <td className="py-3 px-4 font-numeric text-sm text-gain">{formatCurrency(Number(d.gross_amount))}</td>
                      <td className="py-3 px-4 font-numeric text-xs text-muted-foreground">{formatCurrency(Number(d.ir_withheld))}</td>
                      <td className="py-3 px-4 font-numeric text-sm text-white font-medium">{formatCurrency(Number(d.net_amount))}</td>
                      <td className="py-3 px-4"><SourceBadge source={d.source} /></td>
                      <td className="py-3 px-4 w-20">
                        {deletingId === d.id ? (
                          <div className="flex items-center gap-2 text-xs">
                            <button
                              onClick={() => deleteDividend.mutate(d.id)}
                              disabled={deleteDividend.isPending}
                              className="text-loss hover:underline disabled:opacity-50"
                            >
                              Confirmar
                            </button>
                            <span className="text-muted-foreground">·</span>
                            <button onClick={() => setDeletingId(null)} className="text-muted-foreground hover:text-white">
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openEdit(d)}
                              className="text-muted-foreground hover:text-white transition-colors"
                              title="Editar"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              onClick={() => setDeletingId(d.id)}
                              className="text-muted-foreground hover:text-loss transition-colors"
                              title="Excluir"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <DividendFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        dividend={editing}
      />
    </>
  );
}
