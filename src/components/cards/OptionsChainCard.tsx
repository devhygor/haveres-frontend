import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { quotesApi } from "@/api/quotes";
import type { OptionContract } from "@/types/quote";
import { formatCurrency } from "@/utils/format";
import { cn } from "@/utils/cn";
import { TrendingUp, TrendingDown, ChevronDown } from "lucide-react";

interface Props {
  ticker: string;
}

function fmt(v: number | null, decimals = 2): string {
  if (v === null || v === undefined) return "—";
  return v.toFixed(decimals);
}

function fmtVol(v: number | null): string {
  if (v === null || v === undefined) return "—";
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return String(v);
}

interface ContractRowProps {
  contract: OptionContract;
}

function ContractRow({ contract: c }: ContractRowProps) {
  const itm = c.in_the_money;
  return (
    <tr className={cn("border-b border-haveres-border text-sm", itm && "bg-blue-950/20")}>
      <td className="px-3 py-2 font-numeric text-xs text-gray-400">{c.contract_symbol}</td>
      <td className="px-3 py-2 font-numeric">{formatCurrency(c.strike)}</td>
      <td className="px-3 py-2 font-numeric">{c.last_price != null ? formatCurrency(c.last_price) : "—"}</td>
      <td className="px-3 py-2 font-numeric text-gray-400">{c.bid != null ? formatCurrency(c.bid) : "—"}</td>
      <td className="px-3 py-2 font-numeric text-gray-400">{c.ask != null ? formatCurrency(c.ask) : "—"}</td>
      <td className={cn("px-3 py-2 font-numeric", c.change_percent != null && c.change_percent >= 0 ? "text-gain" : "text-loss")}>
        {c.change_percent != null ? (
          <span className="flex items-center gap-1">
            {c.change_percent >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {fmt(c.change_percent)}%
          </span>
        ) : "—"}
      </td>
      <td className="px-3 py-2 font-numeric text-gray-400">{fmt(c.implied_volatility != null ? c.implied_volatility * 100 : null)}%</td>
      <td className="px-3 py-2 font-numeric text-gray-400">{fmtVol(c.volume)}</td>
      <td className="px-3 py-2 font-numeric text-gray-400">{fmtVol(c.open_interest)}</td>
      <td className="px-3 py-2 text-center">
        {itm && <span className="text-xs bg-blue-600/30 text-blue-400 px-1.5 py-0.5 rounded">ITM</span>}
      </td>
    </tr>
  );
}

export default function OptionsChainCard({ ticker }: Props) {
  const [selectedExpiry, setSelectedExpiry] = useState<string>("");
  const [tab, setTab] = useState<"CALL" | "PUT">("CALL");

  const { data = [], isLoading } = useQuery({
    queryKey: ["options", ticker],
    queryFn: () => quotesApi.getOptions(ticker).then((r) => r.data),
    staleTime: 1000 * 60 * 30,
  });

  const expirationDates = useMemo(() => {
    const seen = new Set<string>();
    return data
      .map((c) => c.expiration_date)
      .filter((d) => { if (seen.has(d)) return false; seen.add(d); return true; })
      .sort();
  }, [data]);

  const activeExpiry = selectedExpiry || expirationDates[0] || "";

  const filtered = useMemo(
    () => data.filter((c) => c.option_type === tab && (!activeExpiry || c.expiration_date === activeExpiry)),
    [data, tab, activeExpiry],
  );

  if (isLoading) {
    return (
      <div className="card-haveres p-4">
        <div className="h-4 w-40 bg-haveres-border rounded animate-pulse mb-4" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <div key={i} className="h-8 bg-haveres-border rounded animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!data.length) return null;

  return (
    <div className="card-haveres p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h3 className="text-sm font-semibold text-gray-300">Cadeia de Opções</h3>
        <div className="flex items-center gap-2">
          {/* Expiry selector */}
          <div className="relative">
            <select
              value={activeExpiry}
              onChange={(e) => setSelectedExpiry(e.target.value)}
              className="appearance-none bg-haveres-dark border border-haveres-border text-gray-300 text-xs rounded px-3 py-1.5 pr-7 focus:outline-none focus:border-haveres-blue"
            >
              {expirationDates.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-2.5 text-gray-400 pointer-events-none" />
          </div>
          {/* CALL / PUT tabs */}
          <div className="flex rounded overflow-hidden border border-haveres-border text-xs">
            {(["CALL", "PUT"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "px-3 py-1.5 transition-colors",
                  tab === t
                    ? t === "CALL" ? "bg-gain/20 text-gain" : "bg-loss/20 text-loss"
                    : "text-gray-400 hover:text-gray-200",
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-xs text-gray-500 border-b border-haveres-border">
              <th className="px-3 py-2 font-medium">Contrato</th>
              <th className="px-3 py-2 font-medium">Strike</th>
              <th className="px-3 py-2 font-medium">Último</th>
              <th className="px-3 py-2 font-medium">Bid</th>
              <th className="px-3 py-2 font-medium">Ask</th>
              <th className="px-3 py-2 font-medium">Var%</th>
              <th className="px-3 py-2 font-medium">IV</th>
              <th className="px-3 py-2 font-medium">Vol</th>
              <th className="px-3 py-2 font-medium">OI</th>
              <th className="px-3 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => <ContractRow key={c.contract_symbol} contract={c} />)}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-center text-sm text-gray-500 py-6">Sem contratos para este vencimento.</p>
        )}
      </div>
    </div>
  );
}
