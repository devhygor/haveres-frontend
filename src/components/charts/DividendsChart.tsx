import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency, formatDateShort } from "@/utils/format";

export interface DividendChartPoint {
  month: string;
  paid: number;
  upcoming: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const paid = payload.find((p: any) => p.dataKey === "paid")?.value ?? 0;
  const upcoming = payload.find((p: any) => p.dataKey === "upcoming")?.value ?? 0;
  return (
    <div className="bg-haveres-card border border-haveres-border rounded-lg p-3 shadow-xl text-xs space-y-1">
      <p className="text-muted-foreground mb-1">{label}</p>
      {paid > 0 && <p className="text-gain font-mono font-medium">{formatCurrency(paid)}</p>}
      {upcoming > 0 && (
        <p className="font-mono font-medium" style={{ color: "#86efac" }}>
          A receber: {formatCurrency(upcoming)}
        </p>
      )}
    </div>
  );
};

interface Props { data: DividendChartPoint[] }

export function DividendsChart({ data }: Props) {
  const formatted = data.map((d) => ({
    month: formatDateShort(d.month),
    paid: d.paid,
    upcoming: d.upcoming,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={formatted} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" vertical={false} />
        <XAxis dataKey="month" tick={{ fill: "#718096", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#718096", fontSize: 11 }} axisLine={false} tickLine={false}
          tickFormatter={(v) => formatCurrency(v, true)} width={65} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
        <Bar dataKey="paid" name="Recebido" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} maxBarSize={32} />
        <Bar dataKey="upcoming" name="A receber" stackId="a" fill="#86efac" radius={[4, 4, 0, 0]} maxBarSize={32} />
      </BarChart>
    </ResponsiveContainer>
  );
}
