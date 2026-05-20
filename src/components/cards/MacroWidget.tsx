import { useQuery } from "@tanstack/react-query";
import { quotesApi } from "@/api/quotes";
import { TermTooltip } from "@/components/common/TermTooltip";
import type { MacroIndicator } from "@/types/quote";

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
  POUPANCA: "Poupanca",
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

export function MacroWidget() {
  const { data } = useQuery({
    queryKey: ["quotes", "macro"],
    queryFn: () => quotesApi.getMacro().then((r) => r.data),
    staleTime: 300_000,
  });

  if (!data?.length) return null;

  const sorted = [...data].sort(sortIndicators);

  return (
    <div className="card-haveres p-4">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Indicadores</p>
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
    </div>
  );
}
