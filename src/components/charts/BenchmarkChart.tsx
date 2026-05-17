import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import type { BenchmarkPoint } from "@/types/quote";

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

interface Props { data: BenchmarkPoint[] }

export function BenchmarkChart({ data }: Props) {
  const formatted = data.map((d) => ({
    date: d.date.slice(0, 10),
    "Carteira": Number(d.portfolio_return),
    "CDI": Number(d.cdi_return),
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={formatted} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" vertical={false} />
        <XAxis dataKey="date" tick={{ fill: "#718096", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#718096", fontSize: 11 }} axisLine={false} tickLine={false}
          tickFormatter={(v) => `${v.toFixed(1)}%`} width={55} />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 12 }}
          formatter={(v) => <span style={{ color: "#a0aec0" }}>{v}</span>}
        />
        <Line type="monotone" dataKey="Carteira" stroke="#3b82f6" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="CDI" stroke="#22c55e" strokeWidth={2} dot={false} strokeDasharray="4 2" />
      </LineChart>
    </ResponsiveContainer>
  );
}
