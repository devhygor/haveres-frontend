import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Activity } from "lucide-react";
import { quotesApi } from "@/api/quotes";
import type { BenchmarkPoint } from "@/types/quote";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { TermTooltip } from "@/components/common/TermTooltip";
import { cn } from "@/utils/cn";

const PERIODS = [
  { label: "1M",    months: 1 },
  { label: "6M",    months: 6 },
  { label: "12M",   months: 12 },
  { label: "2A",    months: 24 },
  { label: "5A",    months: 60 },
  { label: "10A",   months: 120 },
  { label: "Início", months: 0 },
] as const;

const ASSET_TYPES = [
  { label: "Todos",   value: "ALL" },
  { label: "Ações",   value: "STOCK" },
  { label: "FIIs",    value: "FII" },
  { label: "ETFs",    value: "ETF" },
  { label: "Tesouro", value: "TREASURY" },
  { label: "Outros",  value: "OTHER" },
] as const;

const INDICES = [
  { key: "cdi",    label: "CDI",    field: "cdi_return"    as keyof BenchmarkPoint, color: "#22c55e", dash: "4 2" },
  { key: "ipca",   label: "IPCA",   field: "ipca_return"   as keyof BenchmarkPoint, color: "#f59e0b" },
  { key: "ibov",   label: "IBOV",   field: "ibov_return"   as keyof BenchmarkPoint, color: "#a855f7" },
  { key: "ifix",   label: "IFIX",   field: "ifix_return"   as keyof BenchmarkPoint, color: "#06b6d4" },
  { key: "smll",   label: "SMLL",   field: "smll_return"   as keyof BenchmarkPoint, color: "#f97316" },
  { key: "idiv",   label: "IDIV",   field: "idiv_return"   as keyof BenchmarkPoint, color: "#ec4899" },
  { key: "ivvb11", label: "IVVB11", field: "ivvb11_return" as keyof BenchmarkPoint, color: "#84cc16" },
] as const;

type IndexKey = typeof INDICES[number]["key"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-haveres-card border border-haveres-border rounded-lg p-3 shadow-xl text-xs space-y-1">
      <p className="text-muted-foreground font-medium mb-1">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="text-white font-mono font-medium">{Number(entry.value).toFixed(2)}%</span>
        </div>
      ))}
    </div>
  );
};

export function BenchmarkChart() {
  const [months, setMonths] = useState(12);
  const [assetType, setAssetType] = useState("ALL");
  const [activeIndices, setActiveIndices] = useState<Set<IndexKey>>(new Set(["cdi"]));

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["quotes", "benchmark", months, assetType],
    queryFn: () => quotesApi.getBenchmark(months, assetType).then((r) => r.data),
  });

  const toggleIndex = (key: IndexKey) => {
    setActiveIndices((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const availableIndices = useMemo<Set<string>>(() => {
    if (!data?.length) return new Set();
    const available = new Set<string>();
    INDICES.forEach(({ key, field }) => {
      const points = data.filter((d) => d[field] != null).length;
      if (points >= 2) available.add(key);
    });
    return available;
  }, [data]);

  const formatted = useMemo(() => {
    if (!data) return [];
    return data.map((d) => ({
      date: d.date.slice(0, 10),
      Carteira: Number(d.portfolio_return),
      CDI:    d.cdi_return    != null ? Number(d.cdi_return)    : undefined,
      IPCA:   d.ipca_return   != null ? Number(d.ipca_return)   : undefined,
      IBOV:   d.ibov_return   != null ? Number(d.ibov_return)   : undefined,
      IFIX:   d.ifix_return   != null ? Number(d.ifix_return)   : undefined,
      SMLL:   d.smll_return   != null ? Number(d.smll_return)   : undefined,
      IDIV:   d.idiv_return   != null ? Number(d.idiv_return)   : undefined,
      IVVB11: d.ivvb11_return != null ? Number(d.ivvb11_return) : undefined,
    }));
  }, [data]);

  return (
    <div className="space-y-4">
      {/* Cabeçalho: título + período */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Activity size={18} className="text-haveres-blue" />
          <h2 className="text-sm font-semibold text-white"><TermTooltip term="Rentabilidade Comparada" /></h2>
        </div>
        <div className="flex gap-1">
          {PERIODS.map(({ label, months: m }) => (
            <button
              key={label}
              type="button"
              onClick={() => setMonths(m)}
              className={cn(
                "px-2.5 py-1 text-xs rounded-md font-medium transition-colors",
                months === m
                  ? "bg-haveres-blue text-white"
                  : "bg-secondary text-muted-foreground hover:text-white"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Filtro por tipo de ativo */}
      <div className="flex flex-wrap gap-1">
        {ASSET_TYPES.map(({ label, value }) => (
          <button
            key={value}
            type="button"
            onClick={() => setAssetType(value)}
            className={cn(
              "px-2.5 py-1 text-xs rounded-md font-medium transition-colors",
              assetType === value
                ? "bg-haveres-blue/20 text-haveres-blue border border-haveres-blue/40"
                : "bg-secondary text-muted-foreground hover:text-white border border-transparent"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Toggles de índices */}
      <div className="flex flex-wrap gap-1.5">
        {INDICES.map(({ key, label, color }) => {
          const isActive = activeIndices.has(key);
          const hasData = availableIndices.has(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => hasData && toggleIndex(key)}
              title={!hasData ? "Sem histórico suficiente — sincronize histórico do índice" : undefined}
              disabled={!hasData}
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md font-medium border transition-all",
                !hasData
                  ? "opacity-40 cursor-not-allowed border-haveres-border text-muted-foreground"
                  : isActive
                    ? "border-transparent text-white"
                    : "border-haveres-border text-muted-foreground hover:text-white"
              )}
              style={
                isActive && hasData
                  ? { backgroundColor: `${color}22`, borderColor: color, color }
                  : undefined
              }
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0 transition-colors"
                style={{ backgroundColor: isActive && hasData ? color : "#4a5568" }}
              />
              <TermTooltip term={label} className="inline-flex items-center" />
            </button>
          );
        })}
      </div>

      {/* Gráfico */}
      {isLoading ? (
        <div className="h-[260px] flex items-center justify-center">
          <LoadingState />
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !formatted.length ? (
        <p className="text-sm text-muted-foreground py-10 text-center">
          Sem histórico. Os dados aparecerão após o primeiro snapshot diário.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={formatted} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: "#718096", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#718096", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v.toFixed(1)}%`}
              width={55}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(160, 174, 192, 0.12)" }} />

            {/* Carteira — sempre visível */}
            <Line
              type="monotone"
              dataKey="Carteira"
              stroke="#3b82f6"
              strokeWidth={2.5}
              dot={false}
              connectNulls
            />

            {/* Índices selecionados */}
            {INDICES.map((idx) => {
              if (!activeIndices.has(idx.key)) return null;
              return (
                <Line
                  key={idx.key}
                  type="monotone"
                  dataKey={idx.label}
                  stroke={idx.color}
                  strokeWidth={1.5}
                  dot={false}
                  strokeDasharray={"dash" in idx ? (idx as any).dash : undefined}
                  connectNulls={false}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
