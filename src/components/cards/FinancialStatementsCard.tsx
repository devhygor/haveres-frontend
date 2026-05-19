import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp } from "lucide-react";
import { quotesApi } from "@/api/quotes";
import { formatCurrency } from "@/utils/format";
import { cn } from "@/utils/cn";
import type { FinancialStatementItem } from "@/types/quote";

type Tab = "INCOME" | "BALANCE_SHEET" | "CASH_FLOW";

const TABS: { key: Tab; label: string }[] = [
  { key: "INCOME", label: "DRE" },
  { key: "BALANCE_SHEET", label: "Balanço" },
  { key: "CASH_FLOW", label: "Fluxo de Caixa" },
];

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

interface RowProps {
  label: string;
  items: FinancialStatementItem[];
  field: keyof FinancialStatementItem;
  highlight?: boolean;
}

function StatRow({ label, items, field, highlight }: RowProps) {
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

const INCOME_ROWS: { label: string; field: keyof FinancialStatementItem; highlight?: boolean }[] = [
  { label: "Receita", field: "total_revenue" },
  { label: "Lucro Bruto", field: "gross_profit" },
  { label: "EBIT", field: "ebit" },
  { label: "EBITDA", field: "ebitda" },
  { label: "Lucro Líquido", field: "net_income", highlight: true },
];

const BALANCE_ROWS: { label: string; field: keyof FinancialStatementItem; highlight?: boolean }[] = [
  { label: "Ativo Total", field: "total_assets" },
  { label: "Passivo Total", field: "total_liabilities" },
  { label: "Patrimônio Líq.", field: "total_equity", highlight: true },
  { label: "Caixa e Equiv.", field: "cash_and_equivalents" },
  { label: "Dívida Longo Prazo", field: "long_term_debt" },
];

const CASHFLOW_ROWS: { label: string; field: keyof FinancialStatementItem; highlight?: boolean }[] = [
  { label: "Op. (FCO)", field: "operating_cash_flow" },
  { label: "Invest. (FCI)", field: "investing_cash_flow" },
  { label: "Financ. (FCF)", field: "financing_cash_flow" },
  { label: "Capex", field: "capital_expenditures" },
  { label: "Fluxo de Caixa Livre", field: "free_cash_flow", highlight: true },
];

const ROWS_BY_TAB: Record<Tab, typeof INCOME_ROWS> = {
  INCOME: INCOME_ROWS,
  BALANCE_SHEET: BALANCE_ROWS,
  CASH_FLOW: CASHFLOW_ROWS,
};

interface Props {
  ticker: string;
}

export function FinancialStatementsCard({ ticker }: Props) {
  const [tab, setTab] = useState<Tab>("INCOME");

  const { data, isLoading } = useQuery({
    queryKey: ["quotes", ticker, "financials", tab],
    queryFn: () => quotesApi.getFinancials(ticker, tab, "ANNUAL").then((r) => r.data),
    staleTime: 1000 * 60 * 60,
  });

  const rows = ROWS_BY_TAB[tab];

  return (
    <div className="card-haveres p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp size={18} className="text-haveres-blue" />
        <h2 className="text-sm font-semibold text-white">Demonstrações Financeiras</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              "px-3 py-1 text-xs rounded-md transition-colors",
              tab === t.key
                ? "bg-haveres-blue text-white"
                : "bg-secondary text-muted-foreground hover:text-white"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-xs text-muted-foreground py-4 text-center">Carregando...</p>
      ) : !data?.length ? (
        <p className="text-xs text-muted-foreground py-4 text-center">
          Dados financeiros não disponíveis para {ticker}.
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

          {/* Linhas de dados */}
          {rows.map((row) => (
            <StatRow key={row.field as string} label={row.label} items={data} field={row.field} highlight={row.highlight} />
          ))}
        </>
      )}
    </div>
  );
}
