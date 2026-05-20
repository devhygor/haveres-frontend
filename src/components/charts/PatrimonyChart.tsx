import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { addMonths, format, isValid, parseISO, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency } from "@/utils/format";
import type { PatrimonyPoint } from "@/types/portfolio";

interface Props { data: PatrimonyPoint[] }

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

export function PatrimonyChart({ data }: Props) {
  const formatted = data
    .map((d) => {
      const parsedDate = typeof d.date === "string" ? parseISO(d.date) : d.date;
      const totalValue = Number(d.total_value);
      const totalInvested = Number(d.total_invested);

      if (!isValid(parsedDate) || !Number.isFinite(totalValue) || !Number.isFinite(totalInvested)) {
        return null;
      }

      return {
        ...d,
        total_value: totalValue,
        total_invested: totalInvested,
        timestamp: parsedDate.getTime(),
        tooltip_label: format(parsedDate, "dd MMM", { locale: ptBR }),
      };
    })
    .filter((point): point is NonNullable<typeof point> => point !== null)
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

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={formatted} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <defs>
          <linearGradient id="gradValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="gradInvested" x1="0" y1="0" x2="0" y2="1">
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
          tickFormatter={(value) => format(new Date(value), "MMM yyyy", { locale: ptBR })}
          tick={{ fill: "#718096", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis tick={{ fill: "#718096", fontSize: 11 }} axisLine={false} tickLine={false}
          tickFormatter={(v) => formatCurrency(v, true)} width={70} domain={["auto", "auto"]} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(160, 174, 192, 0.12)" }} />
        <Legend
          wrapperStyle={{ fontSize: 12, color: "#718096" }}
          formatter={(v) => <span style={{ color: "#a0aec0" }}>{v}</span>}
        />
        <Area type="monotone" dataKey="total_value" name="Patrimônio"
          stroke="#3b82f6" strokeWidth={2} fill="url(#gradValue)" dot={false} />
        <Area type="monotone" dataKey="total_invested" name="Aportado"
          stroke="#22c55e" strokeWidth={2} fill="url(#gradInvested)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
