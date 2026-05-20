import { useState } from "react";
import type { IndexComparison } from "@/types/assetDetail";
import { formatCurrency } from "@/utils/format";

interface Props {
  ticker: string;
  data: IndexComparison | undefined;
}

const PERIOD_OPTIONS = [
  { label: "1 mês", months: 1 },
  { label: "3 meses", months: 3 },
  { label: "6 meses", months: 6 },
  { label: "1 ano", months: 12 },
  { label: "2 anos", months: 24 },
  { label: "5 anos", months: 60 },
];

export function InvestmentSimulator({ ticker, data }: Props) {
  const [amount, setAmount] = useState(1000);
  const [months, setMonths] = useState(24);

  if (!data) return null;

  const results = data.series.map((series) => {
    if (series.points.length < 2) {
      return { key: series.key, label: series.label, finalValue: amount, returnPct: 0 };
    }

    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - months);
    const startPoint =
      series.points.find((p) => new Date(p.date) >= cutoffDate) ?? series.points[0];
    const endPoint = series.points[series.points.length - 1];

    const returnPct = endPoint.value / startPoint.value - 1;
    const finalValue = amount * (1 + returnPct);
    return { key: series.key, label: series.label, finalValue, returnPct };
  });

  const mainResult = results.find((r) => r.key === ticker);

  return (
    <div className="card-haveres p-4 space-y-4">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Simulador de Investimento
      </h3>

      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">
            Se você tivesse investido
          </label>
          <div className="flex items-center gap-1 bg-haveres-dark border border-haveres-border rounded-lg px-3 py-2">
            <span className="text-muted-foreground text-sm">R$</span>
            <input
              type="number"
              value={amount}
              onChange={(e) =>
                setAmount(Math.max(1, parseFloat(e.target.value) || 1000))
              }
              className="bg-transparent text-white font-numeric text-sm w-24 outline-none"
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Há</label>
          <select
            value={months}
            onChange={(e) => setMonths(parseInt(e.target.value))}
            className="bg-haveres-dark border border-haveres-border rounded-lg px-3 py-2 text-white text-sm outline-none"
          >
            {PERIOD_OPTIONS.map((opt) => (
              <option key={opt.months} value={opt.months}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        {mainResult && (
          <div className="text-sm text-muted-foreground">
            hoje você teria{" "}
            <span className="text-xl font-bold text-white font-numeric">
              {formatCurrency(mainResult.finalValue)}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {results.map((r) => (
          <div
            key={r.key}
            className="flex items-center gap-3 py-2 border-b border-haveres-border/40"
          >
            <div className="w-16 text-xs font-medium text-muted-foreground font-numeric">
              {r.label}
            </div>
            <div className="flex-1 bg-haveres-dark rounded h-1.5">
              <div
                className={`h-1.5 rounded transition-all ${r.returnPct >= 0 ? "bg-gain" : "bg-loss"}`}
                style={{ width: `${Math.min(100, Math.abs(r.returnPct) * 200)}%` }}
              />
            </div>
            <div
              className={`text-sm font-numeric font-medium w-20 text-right ${
                r.returnPct >= 0 ? "text-gain" : "text-loss"
              }`}
            >
              {r.returnPct >= 0 ? "+" : ""}
              {(r.returnPct * 100).toFixed(2)}%
            </div>
            <div className="text-sm font-numeric text-white w-28 text-right">
              {formatCurrency(r.finalValue)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
