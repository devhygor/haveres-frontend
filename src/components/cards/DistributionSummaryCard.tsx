import type { DistributionSummary } from "@/types/assetDetail";

const PERIOD_LABELS: Record<string, string> = {
  "1m": "1 MÊS",
  "3m": "3 MESES",
  "6m": "6 MESES",
  "12m": "12 MESES",
};

interface Props {
  data: DistributionSummary;
}

export function DistributionSummaryCard({ data }: Props) {
  return (
    <div className="card-haveres p-4">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        Distribuições
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {data.periods.map((p) => (
          <div key={p.period} className="bg-haveres-dark rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground font-medium mb-1">
              YIELD {PERIOD_LABELS[p.period] ?? p.period}
            </p>
            <p className="text-lg font-bold text-gain font-numeric">
              {parseFloat(p.yield_pct).toFixed(2)}%
            </p>
            <p className="text-sm text-white font-numeric mt-0.5">
              R$ {parseFloat(p.total_value).toFixed(2)}
            </p>
          </div>
        ))}
      </div>
      {data.last_dividend && (
        <p className="text-xs text-muted-foreground mt-3 text-center">
          Último rendimento:{" "}
          <span className="text-white font-numeric">
            R$ {parseFloat(data.last_dividend).toFixed(2)}
          </span>
        </p>
      )}
    </div>
  );
}
