import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { IndexComparison } from "@/types/assetDetail";

const COLORS: Record<string, string> = {
  default: "#3b82f6",
  BOVA11: "#f59e0b",
  IFIX11: "#8b5cf6",
  DIVO11: "#ec4899",
  SMAL11: "#14b8a6",
  IVVB11: "#f97316",
  CDI: "#22c55e",
  IPCA: "#ef4444",
};

interface Props {
  data: IndexComparison;
  ticker: string;
}

export function BenchmarkComparisonChart({ data, ticker }: Props) {
  const dateSet = new Set<string>();
  const seriesMap: Record<string, Record<string, number>> = {};

  for (const series of data.series) {
    seriesMap[series.key] = {};
    for (const pt of series.points) {
      dateSet.add(pt.date);
      seriesMap[series.key][pt.date] = pt.value;
    }
  }

  const sortedDates = Array.from(dateSet).sort();
  const chartData = sortedDates.map((d) => {
    const row: Record<string, string | number> = { date: formatDate(d) };
    for (const s of data.series) {
      if (seriesMap[s.key][d] !== undefined) {
        row[s.key] = seriesMap[s.key][d];
      }
    }
    return row;
  });

  if (!chartData.length) return null;

  return (
    <div className="card-haveres p-4">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
        Comparação com índices ({data.months} meses)
      </h3>
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
            tickFormatter={(v) => `${v.toFixed(0)}`}
            width={40}
          />
          <Tooltip
            cursor={{ fill: "rgba(160, 174, 192, 0.12)" }}
            contentStyle={{
              backgroundColor: "#1a1f2e",
              border: "1px solid #2d3748",
              borderRadius: "8px",
            }}
            formatter={(v: number, name: string) => {
              const pct = (v - 100).toFixed(2);
              const sign = parseFloat(pct) >= 0 ? "+" : "";
              return [`${sign}${pct}%`, name];
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: "12px", color: "#718096" }}
            formatter={(v) => data.series.find((s) => s.key === v)?.label ?? v}
          />
          {data.series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.key}
              stroke={s.key === ticker ? "#3b82f6" : (COLORS[s.key] ?? "#718096")}
              strokeWidth={s.key === ticker ? 2.5 : 1.5}
              dot={false}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const [y, m] = dateStr.split("-");
  const months = [
    "jan", "fev", "mar", "abr", "mai", "jun",
    "jul", "ago", "set", "out", "nov", "dez",
  ];
  return `${months[parseInt(m) - 1]}/${y.slice(2)}`;
}
