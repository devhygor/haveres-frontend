import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency, formatDateShort } from "@/utils/format";

interface DividendTypeAmount {
  type: string;
  label: string;
  amount: number;
}

export interface DividendChartPoint {
  month: string;
  paid: number;
  upcoming: number;
  paid_details?: DividendTypeAmount[];
  upcoming_details?: DividendTypeAmount[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload as DividendChartPoint | undefined;
  if (!point) return null;

  const paid = point.paid ?? 0;
  const upcoming = point.upcoming ?? 0;
  const paidDetails = point.paid_details ?? [];
  const upcomingDetails = point.upcoming_details ?? [];

  return (
    <div className="bg-haveres-card border border-haveres-border rounded-lg p-3 shadow-xl text-xs space-y-2 min-w-[210px]">
      <p className="text-muted-foreground">{label}</p>
      {paid > 0 && (
        <div className="space-y-1">
          <p className="text-gain font-mono font-medium">Recebido: {formatCurrency(paid)}</p>
          {paidDetails.map((item) => (
            <p key={`paid-${item.type}`} className="text-muted-foreground">
              • {item.label}: <span className="font-mono text-white">{formatCurrency(item.amount)}</span>
            </p>
          ))}
        </div>
      )}
      {upcoming > 0 && (
        <div className="space-y-1">
          <p className="font-mono font-medium" style={{ color: "#86efac" }}>
            A receber: {formatCurrency(upcoming)}
          </p>
          {upcomingDetails.map((item) => (
            <p key={`upcoming-${item.type}`} className="text-muted-foreground">
              • {item.label}: <span className="font-mono text-white">{formatCurrency(item.amount)}</span>
            </p>
          ))}
        </div>
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
    paid_details: d.paid_details,
    upcoming_details: d.upcoming_details,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={formatted} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" vertical={false} />
        <XAxis dataKey="month" tick={{ fill: "#718096", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#718096", fontSize: 11 }} axisLine={false} tickLine={false}
          tickFormatter={(v) => formatCurrency(v, true)} width={65} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(160, 174, 192, 0.12)" }} />
        <Bar dataKey="paid" name="Recebido" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} maxBarSize={32} />
        <Bar dataKey="upcoming" name="A receber" stackId="a" fill="#86efac" radius={[4, 4, 0, 0]} maxBarSize={32} />
      </BarChart>
    </ResponsiveContainer>
  );
}
