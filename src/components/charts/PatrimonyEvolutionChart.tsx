import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { addMonths, format, isValid, parseISO, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { portfolioApi } from "@/api/portfolio";
import { formatCurrency } from "@/utils/format";
import { cn } from "@/utils/cn";
import type { AllocationItem } from "@/types/portfolio";

interface Props {
  availableTypes?: AllocationItem[];
}

const PERIODS = [
  { label: "Início", value: 0 },
  { label: "12M", value: 12 },
  { label: "2A", value: 24 },
  { label: "5A", value: 60 },
  { label: "10A", value: 120 },
];

const ASSET_TYPE_LABELS: Record<string, string> = {
  STOCK: "Ações",
  FII: "FIIs",
  ETF: "ETF",
  BDR: "BDR",
  FIXED_INCOME: "Renda Fixa",
  TREASURY: "Tesouro",
  CASH: "Caixa",
  CRYPTO: "Cripto",
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const dateLabel = payload[0]?.payload?.tooltip_label || label;
  return (
    <div className="bg-haveres-card border border-haveres-border rounded-lg p-3 shadow-xl text-xs space-y-1">
      <p className="text-muted-foreground font-medium mb-2">{dateLabel}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="text-white font-medium font-mono">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  );
};

export function PatrimonyEvolutionChart({ availableTypes = [] }: Props) {
  const [months, setMonths] = useState(12);
  const [assetType, setAssetType] = useState("");

  const { data = [], isLoading } = useQuery({
    queryKey: ["portfolio", "evolution", "patrimony", months, assetType],
    queryFn: () =>
      portfolioApi.getPatrimonyEvolution(months, assetType || undefined).then((r) => r.data),
  });

  const formatted = data
    .map((d) => {
      const parsedDate = typeof d.date === "string" ? parseISO(d.date) : d.date;
      const totalValue = Number(d.total_value);
      const totalInvested = Number(d.total_invested);
      if (!isValid(parsedDate) || !Number.isFinite(totalValue)) return null;
      return {
        ...d,
        total_value: totalValue,
        total_invested: totalInvested,
        timestamp: parsedDate.getTime(),
        tooltip_label: format(parsedDate, "dd MMM yyyy", { locale: ptBR }),
      };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null)
    .sort((a, b) => a.timestamp - b.timestamp);

  const monthTicks = formatted.length > 0
    ? (() => {
      const ticks: number[] = [];
      let current = startOfMonth(new Date(formatted[0].timestamp));
      const last = startOfMonth(new Date(formatted[formatted.length - 1].timestamp));
      while (current <= last) {
        ticks.push(current.getTime());
        current = addMonths(current, 1);
      }
      return ticks;
    })()
    : [];

  const showInvested = !assetType;
  const typeOptions = availableTypes
    .map((t) => ({ key: t.type ?? "", label: ASSET_TYPE_LABELS[t.type ?? ""] ?? t.type_display ?? t.type }))
    .filter((t) => t.key && t.label);

  return (
    <div className="space-y-3">
      {/* Controles */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Período */}
        <div className="flex items-center gap-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setMonths(p.value)}
              className={cn(
                "px-2.5 py-1 rounded text-xs font-medium transition-colors",
                months === p.value
                  ? "bg-haveres-blue text-white"
                  : "text-muted-foreground hover:text-white hover:bg-secondary/60",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Tipo de ativo */}
        {typeOptions.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            <button
              onClick={() => setAssetType("")}
              className={cn(
                "px-2.5 py-1 rounded text-xs font-medium transition-colors",
                assetType === ""
                  ? "bg-secondary text-white"
                  : "text-muted-foreground hover:text-white hover:bg-secondary/60",
              )}
            >
              Todos
            </button>
            {typeOptions.map((t) => (
              <button
                key={t.key}
                onClick={() => setAssetType(t.key)}
                className={cn(
                  "px-2.5 py-1 rounded text-xs font-medium transition-colors",
                  assetType === t.key
                    ? "bg-secondary text-white"
                    : "text-muted-foreground hover:text-white hover:bg-secondary/60",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Gráfico */}
      {isLoading ? (
        <div className="h-52 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-haveres-blue border-t-transparent rounded-full animate-spin" />
        </div>
      ) : formatted.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Sem dados históricos</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={formatted} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="pevGradValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="pevGradInvested" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" vertical={false} />
            <XAxis
              dataKey="timestamp"
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
              ticks={monthTicks}
              tickFormatter={(v) => format(new Date(v), "MMM/yy", { locale: ptBR })}
              tick={{ fill: "#718096", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#718096", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => formatCurrency(v, true)}
              width={70}
              domain={["auto", "auto"]}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(160, 174, 192, 0.12)" }} />
            <Legend
              wrapperStyle={{ fontSize: 11, color: "#718096" }}
              formatter={(v) => <span style={{ color: "#a0aec0" }}>{v}</span>}
            />
            <Area
              type="monotone"
              dataKey="total_value"
              name="Patrimônio"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#pevGradValue)"
              dot={false}
            />
            {showInvested && (
              <Area
                type="monotone"
                dataKey="total_invested"
                name="Aportado"
                stroke="#22c55e"
                strokeWidth={2}
                fill="url(#pevGradInvested)"
                dot={false}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
