import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { quotesApi } from "@/api/quotes";
import { formatCurrency } from "@/utils/format";
import { LoadingState } from "@/components/common/LoadingState";

const RANGES = [
  { label: "7D", value: "5d" },
  { label: "1M", value: "1mo" },
  { label: "3M", value: "3mo" },
  { label: "6M", value: "6mo" },
  { label: "1A", value: "1y" },
  { label: "2A", value: "2y" },
] as const;

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-haveres-card border border-haveres-border rounded-lg p-3 shadow-xl text-xs space-y-1">
      <p className="text-muted-foreground font-medium mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-haveres-blue flex-shrink-0" />
        <span className="text-white font-mono font-medium">{formatCurrency(payload[0].value)}</span>
      </div>
    </div>
  );
};

interface Props { ticker: string }

export function PriceHistoryChart({ ticker }: Props) {
  const [range, setRange] = useState("1y");

  const { data, isLoading } = useQuery({
    queryKey: ["quotes", ticker, "history", range],
    queryFn: () => quotesApi.getHistory(ticker, range).then((r) => r.data),
  });

  const isIntraday = range === "5d";

  const formatted = (data ?? [])
    .slice()
    .sort((a, b) => {
      const keyA = a.datetime_str ?? a.date;
      const keyB = b.datetime_str ?? b.date;
      return keyA.localeCompare(keyB);
    })
    .map((d) => ({
      date: isIntraday && d.datetime_str ? d.datetime_str : d.date.slice(0, 10),
      price: Number(d.close_price),
    }));

  return (
    <div className="card-haveres p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">Histórico de Preços</h3>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-2 py-1 text-xs rounded font-medium transition-colors ${
                range === r.value
                  ? "bg-haveres-blue text-white"
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={formatted} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="gradPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: "#718096", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              interval={isIntraday ? "preserveStartEnd" : "preserveEnd"}
              tickFormatter={isIntraday ? (v: string) => {
                const [datePart, timePart] = v.split("T");
                if (!datePart) return v;
                const [, m, d] = datePart.split("-");
                return timePart ? `${d}/${m} ${timePart.slice(0, 5)}` : `${d}/${m}`;
              } : undefined}
            />
            <YAxis tick={{ fill: "#718096", fontSize: 11 }} axisLine={false} tickLine={false}
              tickFormatter={(v) => formatCurrency(v, true)} width={65}
              domain={["auto", "auto"]} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(160, 174, 192, 0.12)" }} />
            <Area type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={2}
              fill="url(#gradPrice)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
