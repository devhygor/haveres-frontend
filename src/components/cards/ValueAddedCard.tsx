import { useQuery } from "@tanstack/react-query";
import { Layers } from "lucide-react";
import { quotesApi } from "@/api/quotes";
import { formatCurrency } from "@/utils/format";
import { cn } from "@/utils/cn";
import type { ValueAddedStatementItem } from "@/types/quote";

function formatBig(value: number | null): string {
  if (value === null || value === undefined) return "—";
  const abs = Math.abs(Number(value));
  const sign = Number(value) < 0 ? "-" : "";
  if (abs >= 1e12) return `${sign}R$ ${(abs / 1e12).toFixed(1)}T`;
  if (abs >= 1e9) return `${sign}R$ ${(abs / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${sign}R$ ${(abs / 1e6).toFixed(1)}M`;
  return formatCurrency(Number(value));
}

function year(dateStr: string): string {
  return dateStr?.slice(0, 4) ?? "—";
}

interface RowDef {
  label: string;
  field: keyof ValueAddedStatementItem;
  highlight?: boolean;
}

const GENERATION_ROWS: RowDef[] = [
  { label: "Receita", field: "revenue" },
  { label: "Valor Adic. Bruto", field: "gross_added_value" },
  { label: "(−) Deprec./Amort.", field: "depreciation_and_amortization" },
  { label: "Valor Adic. Líquido", field: "net_added_value" },
  { label: "A Distribuir", field: "added_value_to_distribute", highlight: true },
];

const DISTRIBUTION_ROWS: RowDef[] = [
  { label: "Pessoal", field: "team_remuneration" },
  { label: "Tributos", field: "taxes" },
  { label: "Juros s/ Cap. Próprio", field: "interest_on_own_equity" },
  { label: "Dividendos", field: "dividends" },
  { label: "Lucros Retidos", field: "retained_earnings_or_loss", highlight: true },
];

function StatRow({ label, items, field, highlight }: { label: string; items: ValueAddedStatementItem[]; field: keyof ValueAddedStatementItem; highlight?: boolean }) {
  return (
    <div className={cn("grid gap-2 py-2 border-b border-haveres-border/40 last:border-0", `grid-cols-${Math.min(items.length + 1, 5)}`)}>
      <span className={cn("text-xs col-span-1", highlight ? "text-white font-semibold" : "text-muted-foreground")}>{label}</span>
      {items.map((item) => (
        <span key={item.period_end_date} className={cn("font-mono text-xs text-right", highlight ? "text-white font-semibold" : "text-white")}>
          {formatBig(item[field] as number | null)}
        </span>
      ))}
    </div>
  );
}

interface Props {
  ticker: string;
}

export function ValueAddedCard({ ticker }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ["quotes", ticker, "value-added"],
    queryFn: () => quotesApi.getValueAdded(ticker, "ANNUAL").then((r) => r.data),
    staleTime: 1000 * 60 * 60,
  });

  return (
    <div className="card-haveres p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-4">
        <Layers size={18} className="text-haveres-blue" />
        <h2 className="text-sm font-semibold text-white">Demonstração de Valor Adicionado (DVA)</h2>
      </div>

      {isLoading ? (
        <p className="text-xs text-muted-foreground py-4 text-center">Carregando...</p>
      ) : !data?.length ? (
        <p className="text-xs text-muted-foreground py-4 text-center">
          DVA não disponível para {ticker}.
        </p>
      ) : (
        <>
          {/* Header com anos */}
          <div className={cn("grid gap-2 pb-2 border-b border-haveres-border", `grid-cols-${Math.min(data.length + 1, 5)}`)}>
            <span className="text-xs text-muted-foreground">Período</span>
            {data.map((item) => (
              <span key={item.period_end_date} className="font-mono text-xs font-semibold text-muted-foreground text-right">
                {year(item.period_end_date)}
              </span>
            ))}
          </div>

          {/* Geração do valor adicionado */}
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground/70 pt-3 pb-1">Geração</p>
          {GENERATION_ROWS.map((row) => (
            <StatRow key={row.field as string} label={row.label} items={data} field={row.field} highlight={row.highlight} />
          ))}

          {/* Distribuição do valor adicionado */}
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground/70 pt-3 pb-1">Distribuição</p>
          {DISTRIBUTION_ROWS.map((row) => (
            <StatRow key={row.field as string} label={row.label} items={data} field={row.field} highlight={row.highlight} />
          ))}
        </>
      )}
    </div>
  );
}
