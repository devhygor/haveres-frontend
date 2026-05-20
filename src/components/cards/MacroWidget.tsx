import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown } from "lucide-react";
import { quotesApi } from "@/api/quotes";
import { TermTooltip } from "@/components/common/TermTooltip";
import type { MacroIndicator } from "@/types/quote";
import { formatPercent, plClass } from "@/utils/format";
import { cn } from "@/utils/cn";

const LABEL: Record<string, string> = {
  CDI: "CDI",
  SELIC: "Selic",
  SELIC_OVERNIGHT: "Selic Overnight",
  IPCA: "IPCA",
  INPC: "INPC",
  IGPM: "IGP-M",
  TR: "Taxa Referencial",
  IBC_BR: "IBC-Br",
  PIB_MENSAL: "PIB Mensal",
  DESEMPREGO: "Desemprego",
  POUPANCA: "Poupança",
  USD_PTAX: "USD PTAX",
  EUR_PTAX: "EUR PTAX",
};

const PRIORITY_ORDER = [
  "CDI",
  "SELIC",
  "SELIC_OVERNIGHT",
  "IPCA",
  "INPC",
  "IGPM",
  "TR",
  "DESEMPREGO",
  "IBC_BR",
  "PIB_MENSAL",
  "POUPANCA",
  "USD_PTAX",
  "EUR_PTAX",
];

function formatByUnit(type: string, value: number, unit: string | null): string {
  switch (unit) {
    case "percentPerYear":
      return `${value.toFixed(2)}% a.a.`;
    case "percentPerDay":
      return `${value.toFixed(4)}% a.d.`;
    case "percentPerMonth":
      return `${value.toFixed(3)}% a.m.`;
    case "percent":
      return `${value.toFixed(2)}%`;
    case "index":
      return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    case "rate":
      if (type === "USD_PTAX" || type === "EUR_PTAX") {
        return new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
          minimumFractionDigits: 4,
          maximumFractionDigits: 4,
        }).format(value);
      }
      return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    default:
      return `${value.toFixed(2)}% a.a.`;
  }
}

function sortIndicators(a: MacroIndicator, b: MacroIndicator): number {
  const aIdx = PRIORITY_ORDER.indexOf(a.indicator_type);
  const bIdx = PRIORITY_ORDER.indexOf(b.indicator_type);

  const aRank = aIdx === -1 ? PRIORITY_ORDER.length : aIdx;
  const bRank = bIdx === -1 ? PRIORITY_ORDER.length : bIdx;

  if (aRank !== bRank) return aRank - bRank;
  return a.indicator_type.localeCompare(b.indicator_type, "pt-BR", { sensitivity: "base" });
};

function MacroRow({
  type,
  value,
  unit,
  accumulated,
}: {
  type: string;
  value: number;
  unit: string | null;
  accumulated: number | null;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <TermTooltip term={LABEL[type] ?? type} className="text-xs text-muted-foreground" />
      <div className="text-right">
        <span className="font-mono text-sm text-white font-medium">
          {formatByUnit(type, value, unit)}
        </span>
        {accumulated !== null && type === "IPCA" && (
          <p className="font-mono text-xs text-muted-foreground">{accumulated.toFixed(2)}% 12m</p>
        )}
      </div>
    </div>
  );
}

function MarketIndexRow({ ticker, price, changePercent }: { ticker: string; price: number; changePercent: number | null }) {
  const isPositive = (changePercent ?? 0) >= 0;
  return (
    <div className="flex items-center justify-between py-2">
      <TermTooltip term={ticker} className="text-sm font-medium text-white font-mono" />
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm text-white font-semibold">
          {price.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        {changePercent !== null && (
          <div className={cn("flex items-center gap-0.5 text-xs font-mono", plClass(changePercent))}>
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {formatPercent(Math.abs(changePercent))}
          </div>
        )}
      </div>
    </div>
  );
}

export function MacroWidget() {
  const { data } = useQuery({
    queryKey: ["quotes", "macro"],
    queryFn: () => quotesApi.getMacro().then((r) => r.data),
    staleTime: 300_000,
  });

  const { data: marketIndices } = useQuery({
    queryKey: ["quotes", "market-indices"],
    queryFn: () => quotesApi.getMarketIndices().then((r) => r.data),
    staleTime: 60_000,
  });

  const sorted = data?.length ? [...data].sort(sortIndicators) : [];

  const indexOrder: Record<string, number> = {
    IBOV: 1,
    IFIX: 2,
    SMLL: 3,
    IDIV: 4,
  };
  const sortedMarketIndices = marketIndices?.length
    ? [...marketIndices].sort((a, b) => (indexOrder[a.ticker] ?? 999) - (indexOrder[b.ticker] ?? 999))
    : [];

  if (!sorted.length && !sortedMarketIndices.length) return null;

  return (
    <div className="card-haveres p-4">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
        <TermTooltip term="Indicadores">Indicadores</TermTooltip>
      </p>
      {sorted.length > 0 && (
        <div className="divide-y divide-haveres-border/50">
          {sorted.map((m) => (
            <MacroRow
              key={m.indicator_type}
              type={m.indicator_type}
              value={Number(m.value)}
              unit={m.unit}
              accumulated={m.accumulated_12m !== null ? Number(m.accumulated_12m) : null}
            />
          ))}
        </div>
      )}

      {sortedMarketIndices.length > 0 && (
        <div className={cn("divide-y divide-haveres-border/50", sorted.length > 0 && "mt-3 pt-3 border-t border-haveres-border/50")}>
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
            <TermTooltip term="Índices de Mercado">Índices de Mercado</TermTooltip>
          </p>
          {sortedMarketIndices.map((item) => (
            <MarketIndexRow
              key={item.ticker}
              ticker={item.ticker}
              price={Number(item.close_price)}
              changePercent={item.change_percent !== null ? Number(item.change_percent) : null}
            />
          ))}
        </div>
      )}
    </div>
  );
}
