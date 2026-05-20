import { formatCurrency } from "@/utils/format";
import { TermTooltip } from "@/components/common/TermTooltip";
import { cn } from "@/utils/cn";
import { FIIDetail } from "@/types/portfolio";

function Row({ label, value, valueClass }: { label: React.ReactNode; value: string; valueClass?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn("font-mono text-sm font-medium", valueClass ?? "text-white")}>{value}</span>
    </div>
  );
}

function fmtPct(v: number | string | null, decimals = 2) {
  if (v === null || v === undefined) return "—";
  const n = Number(v);
  return isNaN(n) ? "—" : `${n.toFixed(decimals)}%`;
}

function fmtBig(v: number | string | null) {
  if (v === null || v === undefined) return "—";
  const n = Number(v);
  if (isNaN(n)) return "—";
  if (n >= 1e9) return `R$ ${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `R$ ${(n / 1e6).toFixed(2)}M`;
  return formatCurrency(n);
}

interface Props {
  data: FIIDetail;
}

export function FIIDetailCard({ data }: Props) {
  const pvpClass = data.pvp !== null
    ? data.pvp < 1 ? "text-gain" : data.pvp > 1.1 ? "text-loss" : "text-white"
    : "text-white";

  const dyClass = data.dividend_yield !== null
    ? data.dividend_yield >= 8 ? "text-gain" : "text-white"
    : "text-white";

  return (
    <div className="card-haveres p-5">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">Dados do Fundo</h3>
        <div className="flex gap-2 flex-wrap text-xs justify-end">
          {data.fii_type && (
            <span className="px-2 py-0.5 rounded-full bg-haveres-blue/15 text-haveres-blue font-medium">
              {data.fii_type}
            </span>
          )}
          {data.fii_sector && (
            <span className="px-2 py-0.5 rounded-full bg-haveres-border text-muted-foreground font-medium">
              {data.fii_sector}
            </span>
          )}
          {data.management_type && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-medium">
              {data.management_type}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
        <Row
          label={<TermTooltip term="DY">Dividend Yield</TermTooltip>}
          value={fmtPct(data.dividend_yield)}
          valueClass={dyClass}
        />
        <Row
          label={<TermTooltip term="P/VP" />}
          value={data.pvp !== null ? Number(data.pvp).toFixed(2) : "—"}
          valueClass={pvpClass}
        />
        <Row
          label="Último Dividendo"
          value={data.last_dividend !== null ? formatCurrency(Number(data.last_dividend)) : "—"}
        />
        <Row label="Patrimônio Líquido" value={fmtBig(data.net_worth)} />
        <Row
          label="VP por Cota"
          value={data.net_worth_per_share !== null ? formatCurrency(Number(data.net_worth_per_share)) : "—"}
        />
        <Row label="Liquidez Diária" value={fmtBig(data.daily_liquidity)} />
        <Row
          label="Taxa de Adm."
          value={data.management_fee !== null ? fmtPct(data.management_fee) : "—"}
        />
        <Row
          label="Taxa de Performance"
          value={data.performance_fee !== null ? fmtPct(data.performance_fee) : "Não há"}
        />
        {data.num_assets !== null && (
          <Row label="Nº de Ativos" value={String(data.num_assets)} />
        )}
        {data.total_investors !== null && (
          <Row label="Cotistas" value={Number(data.total_investors).toLocaleString("pt-BR")} />
        )}
      </div>

      {data.managed_by && (
        <p className="text-xs text-muted-foreground border-t border-haveres-border pt-3">
          Gestora: <span className="text-white">{data.managed_by}</span>
        </p>
      )}
    </div>
  );
}
