import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { DividendHistoryItem } from "@/types/assetDetail";

interface Props {
  items: DividendHistoryItem[];
}

export function DividendAmountChart({ items }: Props) {
  const data = [...items]
    .sort((a, b) => a.ex_date.localeCompare(b.ex_date))
    .slice(-24)
    .map((item) => ({
      month: formatMonth(item.ex_date),
      value: parseFloat(item.value_per_share),
    }));

  if (!data.length) return null;

  return (
    <div className="card-haveres p-4">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
        Dividendos por período
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(45,55,72,0.5)" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fill: "#718096", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: "#718096", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `R$${v.toFixed(2)}`}
            width={56}
          />
          <Tooltip
            cursor={{ fill: "rgba(160, 174, 192, 0.12)" }}
            contentStyle={{
              backgroundColor: "#1a1f2e",
              border: "1px solid #2d3748",
              borderRadius: "8px",
            }}
            labelStyle={{ color: "#a0aec0" }}
            formatter={(v: number) => [
              `R$ ${v.toFixed(8).replace(/\.?0+$/, "")}`,
              "Dividendo",
            ]}
          />
          <Bar dataKey="value" fill="#22c55e" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function formatMonth(dateStr: string): string {
  const [y, m] = dateStr.split("-");
  const months = [
    "jan", "fev", "mar", "abr", "mai", "jun",
    "jul", "ago", "set", "out", "nov", "dez",
  ];
  return `${months[parseInt(m) - 1]}/${y.slice(2)}`;
}
