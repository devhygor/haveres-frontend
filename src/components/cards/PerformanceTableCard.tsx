import type { AssetPerformance } from "@/types/assetDetail";
import { cn } from "@/utils/cn";

const PERIOD_LABELS: Record<string, string> = {
  "1m": "1 mês",
  "3m": "3 meses",
  "6m": "6 meses",
  "1y": "1 ano",
  "2y": "2 anos",
  "5y": "5 anos",
  "10y": "10 anos",
};

interface Props {
  data: AssetPerformance;
  ticker: string;
}

export function PerformanceTableCard({ data, ticker }: Props) {
  return (
    <div className="card-haveres p-4">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        Rentabilidade de {ticker}
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-haveres-border">
              <th className="text-left py-2 text-muted-foreground font-medium"></th>
              {data.periods.map((p) => (
                <th key={p.period} className="text-right py-2 text-muted-foreground font-medium px-3 font-numeric">
                  {PERIOD_LABELS[p.period] ?? p.period}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-haveres-border/40">
              <td className="py-2 text-muted-foreground">Rentabilidade</td>
              {data.periods.map((p) => (
                <td key={p.period} className={cn("text-right py-2 px-3 font-numeric", colorClass(p.nominal))}>
                  {p.nominal !== null ? `${p.nominal > 0 ? "+" : ""}${p.nominal.toFixed(2)}%` : "—"}
                </td>
              ))}
            </tr>
            <tr>
              <td className="py-2 text-muted-foreground text-xs">
                Rentabilidade real
                <br />
                <span className="text-xs opacity-60">menos inflação</span>
              </td>
              {data.periods.map((p) => (
                <td key={p.period} className={cn("text-right py-2 px-3 font-numeric text-sm", colorClass(p.real))}>
                  {p.real !== null ? `${p.real > 0 ? "+" : ""}${p.real.toFixed(2)}%` : "—"}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function colorClass(val: number | null | undefined) {
  if (val === null || val === undefined) return "text-muted-foreground";
  if (val > 0) return "text-gain";
  if (val < 0) return "text-loss";
  return "text-muted-foreground";
}
