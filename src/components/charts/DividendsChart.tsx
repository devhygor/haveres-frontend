import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency, formatDateShort } from "@/utils/format";
import type { DividendsEvolution } from "@/types/portfolio";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-haveres-card border border-haveres-border rounded-lg p-3 shadow-xl text-xs">
      <p className="text-muted-foreground mb-1">{label}</p>
      <p className="text-gain font-mono font-medium">{formatCurrency(payload[0].value)}</p>
    </div>
  );
};

interface Props { data: DividendsEvolution[] }

export function DividendsChart({ data }: Props) {
  const formatted = data.map((d) => ({
    month: formatDateShort(d.month),
    total: Number(d.total),
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={formatted} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" vertical={false} />
        <XAxis dataKey="month" tick={{ fill: "#718096", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#718096", fontSize: 11 }} axisLine={false} tickLine={false}
          tickFormatter={(v) => formatCurrency(v, true)} width={65} />
        <Tooltip content={<CustomTooltip />} cursor={false} />
        <Bar dataKey="total" name="Proventos" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={32} />
      </BarChart>
    </ResponsiveContainer>
  );
}
