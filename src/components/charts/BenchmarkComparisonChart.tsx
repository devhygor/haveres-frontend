import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { IndexComparison } from "@/types/assetDetail";

const COLORS: Record<string, string> = {
  BOVA11: "#f59e0b",
  IFIX: "#8b5cf6",
  DIVO11: "#ec4899",
  SMAL11: "#14b8a6",
  IVVB11: "#f97316",
  CDI: "#22c55e",
  IPCA: "#ef4444",
};

const MONTHS_OPTIONS = [
  { label: "12M", value: 12 },
  { label: "24M", value: 24 },
  { label: "36M", value: 36 },
  { label: "60M", value: 60 },
];

interface Props {
  data: IndexComparison;
  ticker: string;
  months: number;
  onMonthsChange: (m: number) => void;
}

export function BenchmarkComparisonChart({ data, ticker, months, onMonthsChange }: Props) {
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set());

  const toggleSeries = (key: string) => {
    setHiddenSeries((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const visibleSeries = data.series.filter((s) => !hiddenSeries.has(s.key));

  const dateSet = new Set<string>();
  const seriesMap: Record<string, Record<string, number>> = {};

  for (const series of visibleSeries) {
    seriesMap[series.key] = {};
    for (const pt of series.points) {
      dateSet.add(pt.date);
      seriesMap[series.key][pt.date] = pt.value;
    }
  }

  const sortedDates = Array.from(dateSet).sort();
  const chartData = sortedDates.map((d) => {
    const row: Record<string, string | number> = { date: fmtDate(d) };
    for (const s of visibleSeries) {
      if (seriesMap[s.key][d] !== undefined) row[s.key] = seriesMap[s.key][d];
    }
    return row;
  });

  return (
    <div className="card-haveres p-4 space-y-4">
      {/* Header + meses */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Comparação com índices
        </h3>
        <div className="flex gap-1">
          {MONTHS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onMonthsChange(opt.value)}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                months === opt.value
                  ? "bg-haveres-blue text-white"
                  : "bg-haveres-dark text-muted-foreground hover:text-white border border-haveres-border"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Toggles de séries */}
      <div className="flex flex-wrap gap-2">
        {data.series.map((s) => {
          const color = s.key === ticker ? "#3b82f6" : (COLORS[s.key] ?? "#718096");
          const hidden = hiddenSeries.has(s.key);
          return (
            <button
              key={s.key}
              onClick={() => toggleSeries(s.key)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-opacity ${
                hidden ? "opacity-30" : "opacity-100"
              }`}
            >
              <span
                className="inline-block w-3 h-0.5 rounded-full"
                style={{ backgroundColor: color, height: "2px" }}
              />
              <span style={{ color: hidden ? "#718096" : color }}>{s.label}</span>
            </button>
          );
        })}
      </div>

      {!chartData.length ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Sem dados para o período selecionado.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(45,55,72,0.5)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: "#718096", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: "#718096", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${(v - 100).toFixed(0)}%`}
              width={44}
            />
            <Tooltip
              cursor={{ fill: "rgba(160, 174, 192, 0.12)" }}
              contentStyle={{
                backgroundColor: "#1a1f2e",
                border: "1px solid #2d3748",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              formatter={(v: number, name: string) => {
                const pct = (v - 100).toFixed(2);
                const sign = parseFloat(pct) >= 0 ? "+" : "";
                const label = data.series.find((s) => s.key === name)?.label ?? name;
                return [`${sign}${pct}%`, label];
              }}
            />
            {visibleSeries.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                stroke={s.key === ticker ? "#3b82f6" : (COLORS[s.key] ?? "#718096")}
                strokeWidth={s.key === ticker ? 2.5 : 1.5}
                dot={false}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

function fmtDate(dateStr: string): string {
  const [y, m] = dateStr.split("-");
  const months = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
  return `${months[parseInt(m) - 1]}/${y.slice(2)}`;
}
