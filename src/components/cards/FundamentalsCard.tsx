import { formatCurrency } from "@/utils/format";
import type { Position } from "@/types/portfolio";

function toNum(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-mono text-sm font-medium text-white">{value}</span>
    </div>
  );
}

interface Props {
  position: Pick<
    Position,
    "price_to_earnings" | "price_to_book" | "earnings_per_share" |
    "market_cap" | "week_52_high" | "week_52_low"
  >;
}

export function FundamentalsCard({ position }: Props) {
  const pl = toNum(position.price_to_earnings);
  const pvp = toNum(position.price_to_book);
  const eps = toNum(position.earnings_per_share);
  const cap = toNum(position.market_cap);
  const high52 = toNum(position.week_52_high);
  const low52 = toNum(position.week_52_low);

  const fmt = (v: number | null, decimals = 2) =>
    v !== null ? v.toFixed(decimals) : "—";

  const fmtCap = (v: number | null) => {
    if (v === null) return "—";
    if (v >= 1e12) return `R$ ${(v / 1e12).toFixed(2)}T`;
    if (v >= 1e9) return `R$ ${(v / 1e9).toFixed(2)}B`;
    if (v >= 1e6) return `R$ ${(v / 1e6).toFixed(2)}M`;
    return formatCurrency(v);
  };

  return (
    <div className="card-haveres p-5">
      <h3 className="text-sm font-semibold text-white mb-4">Indicadores Fundamentalistas</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Row label="P/L" value={fmt(pl)} />
        <Row label="P/VP" value={fmt(pvp)} />
        <Row label="LPA (EPS)" value={eps !== null ? formatCurrency(eps) : "—"} />
        <Row label="Market Cap" value={fmtCap(cap)} />
        <Row label="Máx 52 semanas" value={high52 !== null ? formatCurrency(high52) : "—"} />
        <Row label="Mín 52 semanas" value={low52 !== null ? formatCurrency(low52) : "—"} />
      </div>
    </div>
  );
}
