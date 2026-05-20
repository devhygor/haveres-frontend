import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
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

const MAX_TYPE_LINES = 2;

function summarizeDetails(details: DividendTypeAmount[]) {
  const visible = details.slice(0, MAX_TYPE_LINES);
  const hidden = details.slice(MAX_TYPE_LINES);
  return {
    visible,
    hiddenCount: hidden.length,
    hiddenAmount: hidden.reduce((sum, item) => sum + item.amount, 0),
  };
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload as DividendChartPoint | undefined;
  if (!point) return null;

  const normalizedLabel =
    typeof label === "string" && /^\d{4}-\d{2}$/.test(label)
      ? formatDateShort(`${label}-01`)
      : label;

  const paid = point.paid ?? 0;
  const upcoming = point.upcoming ?? 0;
  const monthTotal = paid + upcoming;
  const paidDetails = point.paid_details ?? [];
  const upcomingDetails = point.upcoming_details ?? [];

  const paidSummary = summarizeDetails(paidDetails);
  const upcomingSummary = summarizeDetails(upcomingDetails);

  return (
    <div className="bg-haveres-card border border-haveres-border rounded-lg p-3 shadow-xl text-xs space-y-2 min-w-[250px]">
      <div className="flex items-center justify-between border-b border-haveres-border/70 pb-1">
        <p className="text-muted-foreground">{normalizedLabel}</p>
        <p className="text-white font-mono font-semibold">Total: {formatCurrency(monthTotal)}</p>
      </div>

      <div className="rounded-md bg-secondary/30 p-2 space-y-1">
        <div className="flex items-center justify-between">
          <p className="text-gain font-medium">Recebido</p>
          <p className="font-mono text-white">{formatCurrency(paid)}</p>
        </div>
        {paidSummary.visible.map((item) => (
          <div key={`paid-${item.type}`} className="flex items-center justify-between gap-3 text-muted-foreground">
            <span className="truncate">{item.label}</span>
            <span className="font-mono text-white">{formatCurrency(item.amount)}</span>
          </div>
        ))}
        {paidSummary.hiddenCount > 0 && (
          <div className="flex items-center justify-between gap-3 text-muted-foreground">
            <span>Outros ({paidSummary.hiddenCount})</span>
            <span className="font-mono text-white">{formatCurrency(paidSummary.hiddenAmount)}</span>
          </div>
        )}
      </div>

      <div className="rounded-md bg-secondary/30 p-2 space-y-1">
        <div className="flex items-center justify-between">
          <p className="font-medium" style={{ color: "#86efac" }}>A receber</p>
          <p className="font-mono text-white">{formatCurrency(upcoming)}</p>
        </div>
        {upcomingSummary.visible.map((item) => (
          <div key={`upcoming-${item.type}`} className="flex items-center justify-between gap-3 text-muted-foreground">
            <span className="truncate">{item.label}</span>
            <span className="font-mono text-white">{formatCurrency(item.amount)}</span>
          </div>
        ))}
        {upcomingSummary.hiddenCount > 0 && (
          <div className="flex items-center justify-between gap-3 text-muted-foreground">
            <span>Outros ({upcomingSummary.hiddenCount})</span>
            <span className="font-mono text-white">{formatCurrency(upcomingSummary.hiddenAmount)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

interface Props {
  data: DividendChartPoint[];
  selectedMonth?: string | null;
  onMonthSelect?: (month: string) => void;
}

export function DividendsChart({ data, selectedMonth = null, onMonthSelect }: Props) {
  const formatted = data.map((d) => ({
    month_key: d.month.slice(0, 7),
    paid: d.paid,
    upcoming: d.upcoming,
    paid_details: d.paid_details,
    upcoming_details: d.upcoming_details,
  }));

  const getCellOpacity = (monthKey: string) => {
    if (!selectedMonth) return 1;
    return selectedMonth === monthKey ? 1 : 0.35;
  };

  const handleBarClick = (entry: any) => {
    const monthKey = entry?.payload?.month_key || entry?.month_key;
    if (!monthKey || !onMonthSelect) return;
    onMonthSelect(monthKey);
  };

  const renderMonthTick = (props: any) => {
    const { x = 0, y = 0, payload } = props;
    const monthKey = String(payload?.value ?? "");
    if (!monthKey) return <g />;

    const isSelected = monthKey === selectedMonth;

    return (
      <g
        transform={`translate(${x},${y})`}
        onClick={() => onMonthSelect?.(monthKey)}
        style={{ cursor: onMonthSelect ? "pointer" : "default" }}
      >
        <text
          x={0}
          y={0}
          dy={16}
          textAnchor="middle"
          fill={isSelected ? "#e2e8f0" : "#718096"}
          fontSize={11}
          fontWeight={isSelected ? 600 : 400}
        >
          {formatDateShort(`${monthKey}-01`)}
        </text>
      </g>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={formatted} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" vertical={false} />
        <XAxis
          dataKey="month_key"
          tick={renderMonthTick}
          axisLine={false}
          tickLine={false}
        />
        <YAxis tick={{ fill: "#718096", fontSize: 11 }} axisLine={false} tickLine={false}
          tickFormatter={(v) => formatCurrency(v, true)} width={65} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(160, 174, 192, 0.12)" }} />
        <Bar
          dataKey="paid"
          name="Recebido"
          stackId="a"
          fill="#22c55e"
          radius={[0, 0, 0, 0]}
          maxBarSize={32}
          onClick={handleBarClick}
        >
          {formatted.map((item) => (
            <Cell
              key={`paid-${item.month_key}`}
              cursor={onMonthSelect ? "pointer" : "default"}
              fillOpacity={getCellOpacity(item.month_key)}
            />
          ))}
        </Bar>
        <Bar
          dataKey="upcoming"
          name="A receber"
          stackId="a"
          fill="#86efac"
          radius={[4, 4, 0, 0]}
          maxBarSize={32}
          onClick={handleBarClick}
        >
          {formatted.map((item) => (
            <Cell
              key={`upcoming-${item.month_key}`}
              cursor={onMonthSelect ? "pointer" : "default"}
              fillOpacity={getCellOpacity(item.month_key)}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
